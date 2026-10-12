import test from "node:test";
import assert from "node:assert/strict";
const response = (
  body = "<html><body>Test</body></html>",
  status = 200,
  url = "https://example.com/",
  headers = {},
) => ({
  ok: true,
  result: {
    url,
    status,
    headers: { "content-type": "text/html", ...headers },
    body,
    bytes: Buffer.byteLength(body),
    cookies: [],
    chain: [{ url, status }],
  },
});
import { auditSite, datedClaims } from "../src/audit.js";
test("historical year is only review candidate; undated text excluded", () => {
  const r = datedClaims(
    "<p>2020 yılında kurulan bu kurum hizmet vermektedir.</p><p>Bu kurum eğitim hizmeti sunar.</p>",
    "https://example.com",
    2026,
  );
  assert.equal(r.length, 1);
  assert.equal(r[0].old, true);
});
test("dated claim connects source and avoids truth verdict", async () => {
  const fetcher = async (url) =>
    url === "https://example.com/"
      ? response(
          '<p>2026 yılında henüz başlamadı. <a href="https://source.example/">Kaynak</a></p>',
        )
      : response(
          '<p>2026 yılı duyurusu</p><time datetime="2026-10-12"></time>',
          200,
          url,
        );
  const r = await auditSite("example.com", { fetcher, year: 2026 });
  assert.match(r.bolumler[0].satirlar[0].deger, /Kaynak tarihi: 2026-10-12/);
  assert.equal(r.bulgular[0].seviye, "bilgi");
});
