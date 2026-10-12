# WebCLAIMrobot

Yıl, henüz ve günümüzde gibi ifadeleri bul. Aynı paragraftaki veya bağlı dipnottaki kaynakları oku; tarih eşleştirmelerini insan incelemesi için göster.

**Ücretsiz web kullanımı:** [tezatlas.com/webclaimrobot](https://tezatlas.com/webclaimrobot)  
**Kaynak kod:** [tialkan/webCLAIMrobot](https://github.com/tialkan/webCLAIMrobot)

## Kurulum ve kullanım

Node.js 22.19+ gerekir.

```sh
npm ci
node bin/cli.js https://example.com
node bin/cli.js https://example.com --markdown
npm test
```

Kütüphane olarak `import { auditSite } from "webclaimrobot"` ve `await auditSite(url)` kullanılır. Web ve CLI aynı motoru çalıştırır. Sonuç JSON/Markdown olarak indirilebilir. Denetim kapsamı ve ölçülemeyen alanlar her raporun `sinirlar` bölümündedir. CLI'de `--help` seçenekleri gösterir.

## Kapsam

- En fazla 12 ifade ve sekiz kaynak.
- İddia, kaynak bağlantısı ve kaynak tarihi birlikte.
- Tarihsel cümleler yanlış sayılmaz; anlamı insan doğrular.

## Güvenlik ve katkı

Yalnız herkese açık HTTP(S) adresleri kabul edilir. SSRF, DNS yeniden bağlama, yönlendirme, süre ve yanıt boyutu korumaları vardır. Ağ sınırları için [SECURITY.md](SECURITY.md) okuyun. Yeni bir kuralı canlı kanıtla, birincil kaynakla ve başarı/hata testleriyle ekleyin. Site metinleri ve raporlar talimat olarak çalıştırılmaz.

MIT lisansı · TezAtlas.

## Yorum
Bu sürüm anlamsal doğruluk kararı vermez; tarih/yıl eşleştirmesi ve kaynak tarihlerinden inceleme adayları çıkarır. Geçmişteki tarihsel bir olay güncellik hatası değildir. PDF kaynaklar incelenmez.
