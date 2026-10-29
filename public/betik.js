
let etkinlikler = [];
let seciliTur = "tumu";
let yuklendi = false;

const liste = document.getElementById("liste");
const mesaj = document.getElementById("mesaj");
const arama = document.getElementById("arama");
const butonlar = document.querySelectorAll(".filtre");


async function verileriGetir() {
  mesaj.textContent = "Yükleniyor...";
  try {
    const cevap = await fetch("/api/etkinlikler");
    if (!cevap.ok) {
      throw new Error("Sunucu hatası: " + cevap.status);
    }
    etkinlikler = await cevap.json();
    yuklendi = true;
    mesaj.className = "";
    listele();
  } catch (hata) {
    console.log(hata);
    mesaj.textContent = "Etkinlikler yüklenemedi! Terminalde npm start yazıp http://localhost:3000 adresinden açın.";
    mesaj.className = "hata";
  }
}


function listele() {

  if (!yuklendi) {
    return;
  }
  liste.innerHTML = "";
  const aranan = arama.value.toLowerCase();

  const sonuc = etkinlikler.filter(function (e) {
    const turUygun = seciliTur === "tumu" || e.tur === seciliTur;
    const aramaUygun = e.baslik.toLowerCase().includes(aranan);
    return turUygun && aramaUygun;
  });

  if (sonuc.length === 0) {
    mesaj.textContent = "Aramanıza uygun etkinlik yok.";
    return;
  }
  mesaj.textContent = "";

  sonuc.forEach(function (e) {
    const kart = document.createElement("div");
    kart.className = "kart";

    const tur = document.createElement("p");
    tur.className = "tur";
    tur.textContent = e.tur;

    const baslik = document.createElement("h3");
    baslik.textContent = e.baslik;

    const tarih = document.createElement("p");
    tarih.textContent = "Tarih: " + new Date(e.tarih).toLocaleDateString("tr-TR");

    const yer = document.createElement("p");
    yer.textContent = "Yer: " + e.yer;

    const kontenjan = document.createElement("p");
    kontenjan.textContent = "Kontenjan: " + e.kontenjan;

    kart.appendChild(tur);
    kart.appendChild(baslik);
    kart.appendChild(tarih);
    kart.appendChild(yer);
    kart.appendChild(kontenjan);
    liste.appendChild(kart);
  });
}


butonlar.forEach(function (buton) {
  buton.addEventListener("click", function () {
    butonlar.forEach(function (b) {
      b.classList.remove("secili");
    });
    buton.classList.add("secili");
    seciliTur = buton.dataset.tur;
    listele();
  });
});


arama.addEventListener("input", listele);


const form = document.getElementById("form");
const formMesaj = document.getElementById("form-mesaj");

form.addEventListener("submit", function (olay) {
  olay.preventDefault();

  const ad = document.getElementById("ad").value.trim();
  const tarih = document.getElementById("tarih").value;
  const eposta = document.getElementById("eposta").value.trim();


  const bugun = new Date().toISOString().slice(0, 10);

  let hatalar = [];

  if (ad.length < 5) {
    hatalar.push("Etkinlik adı en az 5 karakter olmalı.");
  }
  if (tarih === "") {
    hatalar.push("Tarih boş olamaz.");
  } else if (tarih < bugun) {
    hatalar.push("Geçmiş bir tarih seçilemez.");
  }
  if (!eposta.includes("@") || !eposta.includes(".")) {
    hatalar.push("Geçerli bir e-posta girin.");
  }

  if (hatalar.length > 0) {
    formMesaj.className = "hata";
    formMesaj.innerHTML = "";
    hatalar.forEach(function (h) {
      const satir = document.createElement("p");
      satir.textContent = h;
      formMesaj.appendChild(satir);
    });
  } else {
    formMesaj.className = "basarili";
    formMesaj.textContent = "Öneriniz alındı, teşekkürler!";
    form.reset();
  }
});

verileriGetir();
