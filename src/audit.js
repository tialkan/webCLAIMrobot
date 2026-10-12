import {
  start,
  load,
  document,
  squeeze,
  publicLink,
  finding,
  report,
  section,
  mapLimit,
  assertHtml,
} from "./common.js";
export function datedClaims(html, url, year = new Date().getUTCFullYear()) {
  const $ = load(html);
  $("script,style,noscript,template,nav,footer").remove();
  const claims = [];
  const seen = new Set();
  $("p,li,td,dd,blockquote").each((_, el) => {
    if ($(el).find("p,li,td,dd,blockquote").length) return;
    const text = squeeze($(el).text());
    if (text.length < 20 || text.length > 1800 || seen.has(text)) return;
    const years = [...text.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) =>
      Number(m[0]),
    );
    const relative =
      /(?<![\p{L}\p{N}])(?:henüz|halen|hâlen|şu anda|bugün|günümüzde|artık|bu yıl|geçen yıl)(?![\p{L}\p{N}])/iu.test(
        text,
      );
    if (!years.length && !relative) return;
    seen.add(text);
    let source = $(el)
      .find("a[href]")
      .toArray()
      .filter((a) => !$(a).attr("href").startsWith("#"))
      .map((a) => publicLink($(a).attr("href"), url)?.href)
      .filter(Boolean);
    if (!source.length) {
      const note = $(el).find("a[href^='#']").first().attr("href");
      if (note) {
        const ref = $("[id]").filter(
          (_, n) => $(n).attr("id") === note.slice(1),
        );
        source = ref
          .find("a[href]")
          .toArray()
          .map((a) => publicLink($(a).attr("href"), url)?.href)
          .filter(Boolean);
      }
    }
    claims.push({
      text,
      years,
      relative,
      old: years.some((y) => y < year),
      sources: [...new Set(source)].slice(0, 2),
    });
  });
  return claims.slice(0, 12);
}
export async function auditSite(input, options = {}) {
  const { target, started, response, fetcher, signal } = await start(
    input,
    options,
  );
  assertHtml(response);
  const claims = datedClaims(response.body, response.url, options.year);
  const findings = [];
  const cache = new Map();
  let count = 0;
  const rows = await mapLimit(claims, async (claim) => {
    const observations = [];
    for (const url of claim.sources) {
      if (!cache.has(url) && count < 8) {
        count++;
        cache.set(url, fetcher(url, { signal }));
      }
      if (!cache.has(url)) {
        observations.push("Kaynak örnekleme sınırı nedeniyle okunamadı.");
        continue;
      }
      const a = await cache.get(url);
      if (!a.ok || a.result.status !== 200) {
        observations.push(a.ok ? `Kaynak HTTP ${a.result.status}` : a.error);
        continue;
      }
      if (!/text\/html/.test(a.result.headers["content-type"] ?? "")) {
        observations.push("Kaynak HTML değil; içerik karşılaştırılmadı.");
        continue;
      }
      const { $, text } = document(a.result);
      const sourceDate =
        $("time[datetime]").first().attr("datetime") ||
        $(
          "meta[property='article:modified_time'],meta[property='article:published_time']",
        )
          .first()
          .attr("content") ||
        "Belirtilmedi";
      const missing = claim.years.filter((y) => !text.includes(String(y)));
      observations.push(
        `Kaynak tarihi: ${sourceDate}; iddiadaki yıl kaynakta ${missing.length ? `eşleştirilemedi: ${missing.join(", ")}` : "bulundu"}. Bu eşleşme iddianın desteklendiği anlamına gelmez.`,
      );
    }
    const state = !claim.sources.length
      ? "Kaynak bağlanmamış"
      : observations.length
        ? "İnsan incelemesi gerekiyor"
        : "Kaynak doğrulanamadı";
    findings.push(
      finding(
        "CLAIM-REVIEW",
        state,
        response.url,
        claim.text,
        "İddianın ilgili kaynak pasajını ve geçerli olduğu dönemi karşılaştırın. Eski bir yılı anlatan tarihsel cümleyi güncel bilgi hatası saymayın.",
        "bilgi",
      ),
    );
    return {
      etiket: claim.relative ? "Zamana bağlı ifade" : "Tarihli ifade",
      deger: `${claim.text} · ${state} · ${observations.join(" ") || "Aynı paragrafta açık kaynak bulunamadı."}`,
      url: claim.sources[0],
    };
  });
  return report(
    "WebCLAIMrobot",
    target,
    started,
    findings,
    [
      section(
        "İddia ve kaynak inceleme adayları",
        rows.length
          ? rows
          : [
              {
                etiket: "Durum",
                deger:
                  "Kurallar kapsamında tarihe duyarlı ifade bulunamadı; doğruluk denetimi yapılmış sayılmaz.",
              },
            ],
      ),
    ],
    [
      "En fazla 12 ifade ve sekiz kaynak sayfası incelenir. Kaynak bağlantısı aynı paragraftan veya bağlı dipnottan alınır.",
      "Tarih/yıl eşleştirmesi anlam doğrulaması değildir; araç kesin yanlış veya kesin doğru hükmü vermez.",
      "Geçmiş olaylar geçmiş tarihleriyle doğru olabilir; henüz gibi ifadeler için zaman bağlamını insan doğrulamalıdır.",
      "PDF, giriş gerektiren kaynaklar ve JavaScript ile eklenen içerik incelenmez.",
    ],
  );
}
