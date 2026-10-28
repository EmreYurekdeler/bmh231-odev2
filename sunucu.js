
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const PUBLIC_KLASORU = path.join(__dirname, "public");
const VERI_DOSYASI = path.join(__dirname, "etkinlikler.json");


const ICERIK_TURLERI = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function jsonGonder(res, durumKodu, veri) {
  res.writeHead(durumKodu, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(veri));
}

function metinGonder(res, durumKodu, metin, ekBasliklar = {}) {
  res.writeHead(durumKodu, { "Content-Type": "text/plain; charset=utf-8", ...ekBasliklar });
  res.end(metin);
}


function etkinlikleriOku(geriCagirma) {
  fs.readFile(VERI_DOSYASI, "utf8", (hata, icerik) => {
    if (hata) return geriCagirma(hata);
    try {
      geriCagirma(null, JSON.parse(icerik));
    } catch (ayristirmaHatasi) {
      geriCagirma(ayristirmaHatasi);
    }
  });
}


function dosyaSun(yol, res) {
  let cozulmusYol;
  try {
    cozulmusYol = decodeURIComponent(yol);
  } catch {
    return metinGonder(res, 400, "Hatalı istek");
  }
  if (cozulmusYol === "/") cozulmusYol = "/index.html";


  const dosyaYolu = path.join(PUBLIC_KLASORU, cozulmusYol);
  if (!dosyaYolu.startsWith(PUBLIC_KLASORU + path.sep)) {
    return metinGonder(res, 404, "Sayfa bulunamadı");
  }

  fs.stat(dosyaYolu, (hata, bilgi) => {
    if (hata || !bilgi.isFile()) {
      return metinGonder(res, 404, "Sayfa bulunamadı");
    }
    const uzanti = path.extname(dosyaYolu).toLowerCase();
    const icerikTuru = ICERIK_TURLERI[uzanti] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": icerikTuru });
    fs.createReadStream(dosyaYolu).pipe(res);
  });
}

const sunucu = http.createServer((req, res) => {

  console.log(`[${new Date().toLocaleTimeString("tr-TR")}] ${req.method} ${req.url}`);

  if (req.method !== "GET") {
    return metinGonder(res, 405, "Bu yönteme izin verilmiyor", { Allow: "GET" });
  }


  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const yol = url.pathname;


  if (yol === "/api/etkinlikler") {
    return etkinlikleriOku((hata, etkinlikler) => {
      if (hata) return jsonGonder(res, 500, { hata: "Veri okunamadı" });
      const tur = url.searchParams.get("tur");
      const sonuc = tur ? etkinlikler.filter((e) => e.tur === tur) : etkinlikler;
      jsonGonder(res, 200, sonuc);
    });
  }


  const eslesme = yol.match(/^\/api\/etkinlikler\/(\d+)$/);
  if (eslesme) {
    const id = Number(eslesme[1]);
    return etkinlikleriOku((hata, etkinlikler) => {
      if (hata) return jsonGonder(res, 500, { hata: "Veri okunamadı" });
      const etkinlik = etkinlikler.find((e) => e.id === id);
      if (!etkinlik) return jsonGonder(res, 404, { hata: "Etkinlik bulunamadı" });
      jsonGonder(res, 200, etkinlik);
    });
  }


  if (yol.startsWith("/api/")) {
    return metinGonder(res, 404, "Sayfa bulunamadı");
  }

  dosyaSun(yol, res);
});

sunucu.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
