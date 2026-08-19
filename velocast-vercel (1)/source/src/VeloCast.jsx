import { useState, useEffect } from "react";

/* ================= Engine: kleding ================= */

const DELTA_T = { HERSTEL: -2, DUUR: 0, TEMPO: 3, WEDSTRIJD: 6 };
const MET = { HERSTEL: 6.0, DUUR: 8.0, TEMPO: 10.5, WEDSTRIJD: 13.0 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function calcClothing(p) {
  const tEff = p.tGevoel + DELTA_T[p.intensiteit] + clamp(p.uBias, -5, 5);
  const regen = p.pKans >= 0.6;
  const regenTwijfel = !regen && p.pKans >= 0.3;
  const wind = p.windBft >= 5 && tEff < 18;
  const waarschuwingen = [];
  const achterzak = [];

  if (tEff < 0 && regen)
    waarschuwingen.push("IJzel op de weg. Dit is een dag voor de rollenbank, niet voor heldendom.");
  if (p.duurMin > 180)
    waarschuwingen.push("Rit van 3+ uur: het weer draait sneller dan een crit-rondje. Advies mikt op het koudste stuk, neem afritsbare lagen.");

  let lagen;
  if (tEff < 0) lagen = {
    Basislaag: "Merino lange mouw, de dikke",
    Bovenlichaam: regen ? "Waterdicht winterjack" : "Gevoerd winterjack",
    Broek: "Gevoerde winterbroek, lang",
    Handschoenen: tEff <= -2 ? "Lobsters: kreeftenklauwen aan, ego uit" : "Winterhandschoenen",
    Hoofd: "Thermomuts, buff over de mond",
    Schoenen: regen ? "Regen-winteroverschoenen" : "Neopreen overschoenen",
  };
  else if (tEff < 5) lagen = {
    Basislaag: "Merino lange mouw",
    Bovenlichaam: regen ? "Hardshell over een thermolaag" : "Thermojack",
    Broek: "Gevoerde lange broek",
    Handschoenen: regen ? "Neopreen handschoenen" : "Winterhandschoenen",
    Hoofd: "Onderhelmmuts, oren dicht",
    Schoenen: "Winteroverschoenen",
  };
  else if (tEff < 10) lagen = {
    Basislaag: "Thermobaselayer korte mouw",
    Bovenlichaam: regen ? "Regenjack over je jersey" : "Thermojersey lange mouw",
    Broek: tEff >= 8 ? "Korte broek met 3/4 of beenstukken" : "Korte broek met beenstukken",
    Handschoenen: "Lange vingers",
    Hoofd: "Koerspetje of dunne onderhelmmuts",
    Schoenen: regen ? "Waterafstotende overschoenen" : "Winddichte overschoenen",
  };
  else if (tEff < 15) lagen = {
    Basislaag: "Lichte baselayer, korte mouw",
    Bovenlichaam: regen ? "Lichtgewicht regenjack" : "Jersey met armstukken",
    Broek: tEff < 13 ? "Korte broek met kniestukken, je knieën danken je later" : "Korte broek",
    Handschoenen: "Dunne lange vingers of mitaines",
    Hoofd: regen ? "Koerspetje tegen het spatwater" : null,
    Schoenen: tEff < 12 ? "Teenkapjes, voor wie z'n tenen lief is" : null,
  };
  else if (tEff < 20) lagen = {
    Basislaag: "Lichte baselayer, of niks",
    Bovenlichaam: "Jersey korte mouw",
    Broek: "Korte broek",
    Handschoenen: "Mitaines",
    Hoofd: null,
    Schoenen: null,
  };
  else if (tEff < 25) lagen = {
    Basislaag: "Geen, of een mesh-baselayer",
    Bovenlichaam: "Zomerjersey, de dunne",
    Broek: "Korte broek",
    Handschoenen: "Mitaines",
    Hoofd: "Koerspetje, klep in de zon",
    Schoenen: null,
  };
  else lagen = {
    Basislaag: "Mesh of blote huid",
    Bovenlichaam: "Mesh-jersey, rits mag open",
    Broek: "Korte broek, dunste stof",
    Handschoenen: "Mitaines of niks",
    Hoofd: "Koerspetje plus factor 50 in je nek",
    Schoenen: "Je meest geventileerde paar",
  };

  if (wind && !lagen.Bovenlichaam.toLowerCase().includes("jack"))
    achterzak.push("Gilet, voor als de waaier openbreekt");
  if (regenTwijfel && tEff >= 5) achterzak.push("Opvouwbaar regenjackje, voor de bui die 'misschien' komt");
  if (!wind && tEff >= 10 && tEff < 18) achterzak.push("Gilet voor de afdalingen en de terugweg");

  return { tEff: Math.round(tEff * 10) / 10, regen, wind, lagen, achterzak, waarschuwingen };
}

/* ================= Engine: voeding ================= */

// kh = koolhydraten per stuk, soort bepaalt wanneer het in de rit past
const CATALOGUS = [
  { id: "bidon", naam: "Bidon carb-mix", detail: "80 g poeder per liter", soort: "drinken", kh: 40 },
  { id: "reep", naam: "Energiereep", detail: "kauwwerk voor rustige stukken", soort: "vast", kh: 40 },
  { id: "banaan", naam: "Banaan", detail: "de klassieker uit de musette", soort: "vast", kh: 25 },
  { id: "rijstwafel", naam: "Rijstwafel met jam", detail: "zelf maken, licht verteerbaar", soort: "vast", kh: 30 },
  { id: "dadels", naam: "Handje dadels", detail: "budgetbrandstof uit de natuur", soort: "vast", kh: 30 },
  { id: "gel", naam: "Energiegel", detail: "snelle suiker voor de finale", soort: "snel", kh: 25 },
  { id: "blokjes", naam: "Energieblokjes", detail: "gel-vervanger, kauwbaar", soort: "snel", kh: 25 },
  { id: "cola", naam: "Blikje cola", detail: "bij de bevoorrading, laatste uur", soort: "snel", kh: 35 },
];
const pak = (id) => CATALOGUS.find((c) => c.id === id);

function calcNutrition(p) {
  const uren = p.duurMin / 60;
  const kcalPerUur = Math.round(MET[p.intensiteit] * p.gewicht);
  const kcalTotaal = Math.round(kcalPerUur * uren);
  const tips = [];
  let khPerUur, ratio = null;

  if (p.duurMin < 60) {
    khPerUur = 0;
    tips.push("Korter dan een uur: bidon water erin en trappen. Koffiestop optioneel, maar aanbevolen.");
    if (p.intensiteit === "WEDSTRIJD") tips.push("Mondspoelen met sportdrank en uitspugen. Staat gek, benen merken het verschil.");
  } else if (p.duurMin <= 120) {
    khPerUur = { HERSTEL: 30, DUUR: 45, TEMPO: 60, WEDSTRIJD: 60 }[p.intensiteit];
  } else if (p.duurMin <= 180) {
    khPerUur = { HERSTEL: 60, DUUR: 70, TEMPO: 90, WEDSTRIJD: 90 }[p.intensiteit];
    ratio = "2:1 glucose:fructose";
  } else {
    khPerUur = { HERSTEL: 90, DUUR: 90, TEMPO: 100, WEDSTRIJD: 110 }[p.intensiteit];
    ratio = "1:0.8 glucose:fructose";
    tips.push("Boven de 90 g/u is darmtraining. Bouw rustig op, anders eindigt je koninginnenrit in de bosjes.");
  }
  khPerUur = Math.min(khPerUur, 120);
  if (khPerUur > 60 && !ratio) ratio = "2:1 glucose:fructose";

  const khTotaal = Math.round(khPerUur * Math.max(uren - 0.5, 0));

  let mlPerUur = 500;
  if (p.tGevoel > 20) mlPerUur += 250;
  if (p.tGevoel > 28) mlPerUur += 250;
  if (p.tGevoel > 25) tips.push("Snikheet vandaag: drink vooraf al een halve liter, anders sta je droog voor de eerste helling.");

  /* Verdeling: drinken eerst, dan vast voedsel voor de eerste helft, snelle suikers voor de finale.
     Vast voedsel wordt afgewisseld zodat je niet drie dezelfde repen wegkauwt. */
  const musette = [];
  const voegToe = (id, aantal, wanneer) => {
    if (aantal <= 0) return;
    const c = pak(id);
    musette.push({ ...c, aantal, wanneer, khTotaal: c.kh * aantal });
  };

  let rest = khTotaal;

  const bidons = khTotaal > 0 ? Math.min(p.bidons, Math.max(1, Math.ceil(rest / 40))) : 0;
  if (bidons > 0) { voegToe("bidon", bidons, "de hele rit door"); rest -= bidons * 40; }
  else {
    const n = Math.max(1, Math.min(p.bidons, Math.ceil(uren)));
    musette.push({
      id: "water", naam: "Bidon water of elektrolytendrank", detail: "geen suikers nodig, wel drinken",
      soort: "drinken", kh: 0, aantal: n, wanneer: "de hele rit door", khTotaal: 0,
    });
  }

  const hoogTempo = p.intensiteit === "TEMPO" || p.intensiteit === "WEDSTRIJD";
  if (rest > 0 && uren >= 1.5 && !hoogTempo) {
    // Vaste hap: afwisselen tussen reep, banaan, rijstwafel en dadels
    const vastBudget = Math.min(rest, Math.round(rest * (uren >= 3 ? 0.6 : 0.5)));
    const volgorde = ["reep", "banaan", "rijstwafel", "dadels"];
    let vastRest = vastBudget, i = 0;
    const geteld = {};
    while (vastRest >= 25 && i < 8) {
      const id = volgorde[i % volgorde.length];
      geteld[id] = (geteld[id] || 0) + 1;
      vastRest -= pak(id).kh;
      i++;
    }
    Object.entries(geteld).forEach(([id, n], idx) =>
      voegToe(id, n, idx === 0 ? "eerste uur" : "eerste helft van de rit")
    );
    rest -= vastBudget - Math.max(vastRest, 0);
  }

  if (rest > 0) {
    const gels = Math.ceil(rest / 25);
    if (hoogTempo || uren < 2) {
      voegToe("gel", gels, "elke 30 minuten na het eerste uur");
    } else {
      const helft = Math.floor(gels / 2);
      voegToe("gel", gels - helft, "laatste derde van de rit");
      voegToe("blokjes", helft, "als je geen gel meer kunt zien");
    }
  }
  if (uren >= 3.5) voegToe("cola", 1, "bij de bevoorrading of tankstation");

  if (khPerUur > 0)
    tips.push(`Doel: ${khPerUur} g per uur. Eet vóór je honger hebt. Wie wacht op de hongerklop, heeft 'm al.`);
  if (uren >= 3) tips.push("Het eerste uur teert op je ontbijt. Daarna komt de man met de hamer voor iedereen die z'n zakken dichtlaat.");
  if (hoogTempo && uren >= 2) tips.push("Op dit tempo kauw je niet meer. Vandaar vooral vloeibaar en gel.");

  const geplandKh = musette.reduce((s, m) => s + m.khTotaal, 0);
  const heeftEten = musette.some((m) => m.soort !== "drinken");

  // Onmisbare conclusie: moet je überhaupt eten, of volstaat de bidon?
  let strategie;
  if (khPerUur === 0) {
    strategie = {
      titel: "Geen eten nodig",
      uitleg: `Onder het uur teert je lijf gewoon op je ontbijt. Een bidon water of elektrolytendrank is genoeg — repen en gels kun je thuis laten.`,
    };
  } else if (!heeftEten) {
    strategie = {
      titel: "Geen eten nodig, alles uit de bidon",
      uitleg: `Die ${khPerUur} gram per uur haal je volledig uit je sportdrank. Meng je bidons met carb-mix en je hoeft onderweg niets te kauwen. Een reep achter de hand is nooit verkeerd, maar nodig is het niet.`,
    };
  } else {
    const soorten = [...new Set(musette.filter((m) => m.soort !== "drinken").map((m) => m.soort))];
    strategie = {
      titel: "Bidon plus eten",
      uitleg: `Je sportdrank alleen redt het niet op ${khPerUur} gram per uur. Neem daarom ${soorten.includes("vast") ? "vaste hap voor de eerste helft" : "snelle suikers"}${soorten.length > 1 ? " en gels voor de finale" : ""} mee.`,
    };
  }

  return {
    kcalPerUur, kcalTotaal, khPerUur, khTotaal, geplandKh, ratio, strategie,
    mlPerUur, mlTotaal: Math.round(mlPerUur * uren),
    natrium: p.tGevoel > 20 ? 600 : 400, musette, tips,
  };
}

/* ================= Stijl ================= */

const C = {
  wit: "#FFFFFF", ivoor: "#FAF7F0", navy: "#15263A", grijs: "#5C6675",
  goud: "#B8924A", goudDonker: "#93743A", goudLicht: "#F2E8D3",
  lijn: "#E6DFD0", groen: "#3F7050", rood: "#B54040",
};
const font = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const ZONES = {
  HERSTEL: { label: "Koffierit", sub: "zone 1, praatgemak" },
  DUUR: { label: "Duurrit", sub: "zone 2, motor draait" },
  TEMPO: { label: "Kuitenbijter", sub: "zone 3–4, lippen op elkaar" },
  WEDSTRIJD: { label: "Koers!", sub: "zone 5+, ogen op steeltjes" },
};
const SOORT_LABEL = { drinken: "Uit de bidon", vast: "Vaste hap", snel: "Snelle suiker" };

const kaart = { background: C.wit, border: `1px solid ${C.lijn}`, borderRadius: 16, padding: 20 };
const kop = { fontFamily: font, fontWeight: 800, fontSize: 20, color: C.navy, margin: 0 };
const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  background: C.wit, border: `1.5px solid ${C.lijn}`, borderRadius: 10,
  fontFamily: font, fontSize: 15, fontWeight: 600, color: C.navy, outline: "none",
};

function Veld({ label, children }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 700, color: C.grijs }}>{label}</span>
      {children}
    </label>
  );
}

function TempBalk({ tEff }) {
  const pct = clamp(((tEff + 5) / 35) * 100, 0, 100);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: C.goudLicht }}>
        <div style={{
          position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%,-50%)",
          width: 16, height: 16, borderRadius: "50%", background: C.goud, border: `3px solid ${C.wit}`,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, fontWeight: 600, color: C.grijs }}>
        <span>−5°</span><span>5°</span><span>15°</span><span>25°</span><span>30°+</span>
      </div>
    </div>
  );
}

/* ================= Weer ================= */

const msNaarBft = (ms) => {
  const grenzen = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];
  let b = 0;
  grenzen.forEach((g) => { if (ms >= g) b++; });
  return clamp(b, 0, 12);
};

/* Ingebouwde plaatsenlijst: werkt altijd, ook als de zoekdienst er even uit ligt.
   Twente, Salland en de Achterhoek staan er ruim in, plus alle grotere plaatsen. */
const PLAATSEN = {
  nijverdal: [52.363, 6.464], hellendoorn: [52.376, 6.451], markelo: [52.243, 6.510],
  rijssen: [52.307, 6.520], holten: [52.283, 6.418], wierden: [52.360, 6.590],
  goor: [52.229, 6.583], delden: [52.262, 6.708], diepenheim: [52.196, 6.550],
  vriezenveen: [52.412, 6.626], borne: [52.301, 6.749], haaksbergen: [52.157, 6.741],
  losser: [52.259, 7.007], oldenzaal: [52.313, 6.928], almelo: [52.357, 6.662],
  hengelo: [52.265, 6.793], enschede: [52.221, 6.893], ommen: [52.522, 6.421],
  raalte: [52.387, 6.276], hardenberg: [52.575, 6.620], steenwijk: [52.788, 6.119],
  kampen: [52.555, 5.911], deventer: [52.255, 6.164], zwolle: [52.516, 6.083],
  zutphen: [52.140, 6.196], lochem: [52.161, 6.412], winterswijk: [51.972, 6.719],
  doetinchem: [51.965, 6.288], apeldoorn: [52.211, 5.970], arnhem: [51.985, 5.899],
  nijmegen: [51.842, 5.853], ede: [52.046, 5.664], amersfoort: [52.156, 5.388],
  utrecht: [52.091, 5.122], amsterdam: [52.370, 4.895], haarlem: [52.381, 4.637],
  alkmaar: [52.632, 4.749], leiden: [52.160, 4.490], "den haag": [52.078, 4.288],
  rotterdam: [51.924, 4.478], dordrecht: [51.813, 4.690], breda: [51.586, 4.776],
  tilburg: [51.560, 5.091], "den bosch": [51.697, 5.304], "s-hertogenbosch": [51.697, 5.304],
  eindhoven: [51.441, 5.470], venlo: [51.370, 6.172], maastricht: [50.851, 5.691],
  roermond: [51.194, 5.987], groningen: [53.219, 6.567], assen: [52.995, 6.564],
  emmen: [52.785, 6.898], leeuwarden: [53.201, 5.799], drachten: [53.112, 6.099],
  heerenveen: [52.959, 5.919], lelystad: [52.518, 5.471], almere: [52.371, 5.215],
};

const normaliseer = (s) =>
  s.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/,.*$/, "")            // "Nijverdal, Overijssel" -> "nijverdal"
    .replace(/\s+/g, " ");

async function zoekCoord(plaatsnaam) {
  const sleutel = normaliseer(plaatsnaam);

  // 1. Eigen lijst: exacte treffer, anders een plaats die ermee begint
  if (PLAATSEN[sleutel]) return { lat: PLAATSEN[sleutel][0], lon: PLAATSEN[sleutel][1], naam: plaatsnaam.trim() };
  const bijna = Object.keys(PLAATSEN).find((k) => k.startsWith(sleutel) || sleutel.startsWith(k));
  if (bijna && sleutel.length >= 4) return { lat: PLAATSEN[bijna][0], lon: PLAATSEN[bijna][1], naam: bijna };

  // 2. Online zoekdienst voor alles wat niet in de lijst staat
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sleutel)}&count=5&language=nl&format=json`
    ).then((r) => r.json());
    const treffer = (geo.results || []).find((r) => r.country_code === "NL") || (geo.results || [])[0];
    if (treffer) return { lat: treffer.latitude, lon: treffer.longitude, naam: treffer.name };
  } catch { /* zoekdienst onbereikbaar, we proberen de volgende */ }

  // 3. Laatste redmiddel
  try {
    const n = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sleutel)}&countrycodes=nl&format=json&limit=1`
    ).then((r) => r.json());
    if (n && n[0]) return { lat: +n[0].lat, lon: +n[0].lon, naam: plaatsnaam.trim() };
  } catch { /* ook deze niet */ }

  throw new Error("plaats onbekend");
}

async function weerViaOpenMeteo(plaatsnaam) {
  const p = await zoekCoord(plaatsnaam);
  return { ...(await weerViaCoord(p.lat, p.lon)), naam: p.naam };
}

/* Tweede route: via het enige adres dat de app altijd mag bereiken.
   Vist het eerste gebalanceerde JSON-object uit het antwoord. */
function visJson(tekst) {
  const schoon = String(tekst).replace(/```json|```/g, "");
  let start = schoon.indexOf("{");
  while (start !== -1) {
    let diepte = 0;
    for (let i = start; i < schoon.length; i++) {
      if (schoon[i] === "{") diepte++;
      else if (schoon[i] === "}") {
        diepte--;
        if (diepte === 0) {
          try { return JSON.parse(schoon.slice(start, i + 1)); } catch { break; }
        }
      }
    }
    start = schoon.indexOf("{", start + 1);
  }
  return null;
}

async function weerViaZoeken(plaatsnaam) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Zoek het actuele weer op dit moment in ${plaatsnaam} (Nederland). Antwoord alleen met dit JSON-object: {"gevoelstemp_c": <getal>, "wind_bft": <getal 0-12>, "regenkans_pct": <getal 0-100>, "omschrijving": "<twee woorden, bijv. half bewolkt>"}`,
      }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  const data = await res.json();
  const tekst = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const w = visJson(tekst);
  if (!w) throw new Error("geen weerdata");
  const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const t = num(w.gevoelstemp_c), bft = num(w.wind_bft), kans = num(w.regenkans_pct);
  if (t === null) throw new Error("geen weerdata");
  return {
    tGevoel: Math.round(t),
    bft: bft === null ? 3 : clamp(Math.round(bft), 0, 12),
    kans: kans === null ? 20 : clamp(Math.round(kans / 5) * 5, 0, 100),
    omschrijving: w.omschrijving ? String(w.omschrijving) : "wisselvallig",
    naam: plaatsnaam,
  };
}

async function weerViaCoord(lat, lon) {
  const w = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=apparent_temperature,wind_speed_10m,precipitation,weather_code` +
    `&hourly=precipitation_probability&wind_speed_unit=ms&timezone=auto&forecast_days=1`
  ).then((r) => r.json());
  if (!w.current) throw new Error("geen weerdata");

  const nu = new Date(w.current.time);
  const idx = (w.hourly?.time || []).findIndex((t) => new Date(t) >= nu);
  const kansen = (w.hourly?.precipitation_probability || []).slice(Math.max(idx, 0), Math.max(idx, 0) + 4).filter((n) => n != null);
  const kans = kansen.length ? Math.max(...kansen) : (w.current.precipitation > 0 ? 80 : 0);

  const codes = {
    0: "onbewolkt", 1: "licht bewolkt", 2: "half bewolkt", 3: "bewolkt", 45: "mist", 48: "mist",
    51: "motregen", 53: "motregen", 55: "motregen", 61: "lichte regen", 63: "regen", 65: "stevige regen",
    71: "sneeuw", 73: "sneeuw", 75: "sneeuw", 80: "buien", 81: "buien", 82: "zware buien",
    95: "onweer", 96: "onweer", 99: "onweer",
  };
  return {
    tGevoel: Math.round(w.current.apparent_temperature),
    bft: msNaarBft(w.current.wind_speed_10m),
    kans: clamp(Math.round(kans / 5) * 5, 0, 100),
    omschrijving: codes[w.current.weather_code] || "wisselvallig",
  };
}

/* ================= App ================= */

export default function VeloCast() {
  const [tGevoel, setTGevoel] = useState(12);
  const [pKans, setPKans] = useState(20);
  const [windBft, setWindBft] = useState(3);
  const [intensiteit, setIntensiteit] = useState("DUUR");
  const [duurMin, setDuurMin] = useState(120);
  const [gewicht, setGewicht] = useState(75);
  const [bidons, setBidons] = useState(2);

  const [uBias, setUBias] = useState(0);
  const [fbCount, setFbCount] = useState(0);
  const [rides, setRides] = useState([]);
  const [advies, setAdvies] = useState(null);
  const [pendingRide, setPendingRide] = useState(null);
  const [gevolgd, setGevolgd] = useState(true);
  const [toast, setToast] = useState(null);
  const [geladen, setGeladen] = useState(false);

  const [plaats, setPlaats] = useState("");
  const [weerStatus, setWeerStatus] = useState(null);
  const [weerInfo, setWeerInfo] = useState(null);

  const zetWeer = (w, bron) => {
    setTGevoel(clamp(w.tGevoel, -10, 38));
    setWindBft(w.bft);
    setPKans(w.kans);
    setWeerStatus("ok");
    setWeerInfo(`${bron}: ${w.omschrijving}, voelt als ${w.tGevoel}°, wind ${w.bft} Bft, ${w.kans}% kans op nat worden.`);
  };

  const haalWeer = async (voorPlaats) => {
    const waar = (voorPlaats ?? plaats).trim();
    if (!waar) { setWeerStatus("fout"); setWeerInfo("Vul eerst je plaats in."); return; }
    setWeerStatus("bezig"); setWeerInfo(null);

    // Route 1: rechtstreeks het weerstation bellen
    try {
      const w = await weerViaOpenMeteo(waar);
      zetWeer(w, w.naam || waar);
      return;
    } catch { /* mag niet of ligt eruit, we nemen de omweg */ }

    // Route 2: via de verbinding die altijd openstaat
    setWeerInfo("Het weerstation is niet bereikbaar, ik neem de omweg…");
    try {
      const w = await weerViaZoeken(waar);
      zetWeer(w, w.naam || waar);
    } catch {
      setWeerStatus("fout");
      setWeerInfo(`Het weer voor "${waar}" krijg ik niet binnen. Probeer 't zo nog eens, of zet de schuifjes zelf goed — de rest van de app werkt gewoon door.`);
    }
  };

  const haalViaGps = () => {
    if (!navigator.geolocation) { setWeerStatus("fout"); setWeerInfo("Je browser wil z'n locatie niet geven. Typ je plaats maar in."); return; }
    setWeerStatus("bezig"); setWeerInfo(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const w = await weerViaCoord(pos.coords.latitude, pos.coords.longitude);
          zetWeer(w, "Hier waar je staat");
        } catch {
          setWeerStatus("fout");
          setWeerInfo("Locatie gevonden, maar het weerstation is onbereikbaar. Typ je plaats in, dan neem ik de omweg.");
        }
      },
      () => { setWeerStatus("fout"); setWeerInfo("Geen toestemming voor je locatie. Typ je plaats hierboven in."); },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    (async () => {
      let bewaardePlaats = "";
      try {
        const ruw = localStorage.getItem("velocast-profiel");
        if (ruw) {
          const p = JSON.parse(ruw);
          setUBias(p.uBias ?? 0); setFbCount(p.fbCount ?? 0);
          setRides(p.rides ?? []); setGewicht(p.gewicht ?? 75);
          if (p.plaats) { bewaardePlaats = p.plaats; setPlaats(p.plaats); }
        }
      } catch { /* eerste rit moet nog komen */ }
      setGeladen(true);
      if (bewaardePlaats) haalWeer(bewaardePlaats);
    })();
  }, []);

  const bewaar = async (patch) => {
    const p = { uBias, fbCount, rides, gewicht, plaats, ...patch };
    try { localStorage.setItem("velocast-profiel", JSON.stringify(p)); } catch {}
  };

  const alpha = fbCount >= 20 ? 0.25 : 0.5;
  const dt = DELTA_T[intensiteit];

  const planRit = () => {
    const inp = { tGevoel, pKans: pKans / 100, windBft, intensiteit, duurMin, uBias, gewicht, bidons };
    const kleding = calcClothing(inp);
    setAdvies({ kleding, voeding: calcNutrition(inp) });
    setPendingRide({ id: Date.now(), datum: new Date().toISOString(), tGevoel, intensiteit, duurMin, tEff: kleding.tEff, rating: null });
    setGevolgd(true);
  };

  const geefFeedback = async (rating) => {
    if (!pendingRide) return;
    const delta = gevolgd ? Math.round(alpha * rating * 100) / 100 : 0;
    const nieuwBias = clamp(Math.round((uBias + delta) * 10) / 10, -5, 5);
    const nieuweRides = [{ ...pendingRide, rating, delta }, ...rides].slice(0, 8);
    setUBias(nieuwBias); setFbCount(fbCount + 1); setRides(nieuweRides);
    setPendingRide(null);
    await bewaar({ uBias: nieuwBias, fbCount: fbCount + 1, rides: nieuweRides });
    setToast(
      delta === 0
        ? rating === 0 ? "Chapeau. Niks aanpassen dus." : "Genoteerd, maar je trok je eigen plan. Telt niet mee."
        : `De ploegleider noteert het. Jouw thermostaat staat nu op ${nieuwBias > 0 ? "+" : ""}${nieuwBias}°.`
    );
    setTimeout(() => setToast(null), 4500);
  };

  const ratings = [
    { r: -2, t: "IJspegel", uitleg: "veel te koud" },
    { r: -1, t: "Kippenvel", uitleg: "beetje te fris" },
    { r: 0, t: "Chapeau", uitleg: "precies goed" },
    { r: 1, t: "Broeierig", uitleg: "beetje te warm" },
    { r: 2, t: "Gaargekookt", uitleg: "veel te warm" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.ivoor, color: C.navy, fontFamily: font, lineHeight: 1.45 }}>
      <style>{`
        * { box-sizing: border-box; }
        input:focus, button:focus-visible { outline: 2px solid ${C.goud}; outline-offset: 2px; }
        input[type=range] { accent-color: ${C.goud}; width: 100%; }
        input[type=checkbox] { accent-color: ${C.goud}; }
      `}</style>

      <header style={{ background: C.wit, borderBottom: `1px solid ${C.lijn}` }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>velo<span style={{ color: C.goud }}>cast</span></span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.goudDonker }}>
            thermostaat {uBias > 0 ? "+" : ""}{uBias}° · {fbCount} ritten
          </span>
        </div>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 26px" }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: "clamp(30px, 8vw, 44px)", lineHeight: 1.05 }}>
            Afzien mag,<br /><span style={{ color: C.goud }}>afkoelen niet.</span>
          </h1>
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 15, color: C.grijs, maxWidth: 420 }}>
            velocast zegt wat je aantrekt en wat je in je achterzak propt. Jij hoeft alleen nog te trappen.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 16 }}>

        <section style={kaart}>
          <h2 style={kop}>De koersvoorbereiding</h2>

          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: C.ivoor, border: `1px solid ${C.lijn}` }}>
            <span style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 700, color: C.grijs }}>Waar vertrek je?</span>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="text" value={plaats} placeholder="bijv. Nijverdal"
                onChange={(e) => setPlaats(e.target.value)}
                onBlur={() => bewaar({ plaats })}
                onKeyDown={(e) => { if (e.key === "Enter") { bewaar({ plaats }); haalWeer(); } }}
                style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button onClick={() => { bewaar({ plaats }); haalWeer(); }} disabled={weerStatus === "bezig"}
                style={{
                  padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                  background: C.navy, color: C.goud, fontFamily: font, fontWeight: 800, fontSize: 13,
                  opacity: weerStatus === "bezig" ? 0.6 : 1,
                }}>
                {weerStatus === "bezig" ? "Momentje…" : "Haal 't weer"}
              </button>
            </div>
            <button onClick={haalViaGps}
              style={{
                marginTop: 6, padding: 0, border: "none", background: "none", cursor: "pointer",
                fontFamily: font, fontSize: 12, fontWeight: 700, color: C.goudDonker, textDecoration: "underline",
              }}>
              of pak het weer waar ik nu sta
            </button>
            {weerStatus === "bezig" && (
              <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.grijs }}>
                {weerInfo || "Even bij het weerstation langs…"}
              </p>
            )}
            {weerStatus === "ok" && <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.groen }}>{weerInfo}</p>}
            {weerStatus === "fout" && <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: C.rood }}>{weerInfo}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
            <Veld label={`Gevoelstemperatuur: ${tGevoel}°`}>
              <input type="range" min={-10} max={38} value={tGevoel} onChange={(e) => setTGevoel(+e.target.value)} />
            </Veld>
            <Veld label={`Regenkans: ${pKans}%`}>
              <input type="range" min={0} max={100} step={5} value={pKans} onChange={(e) => setPKans(+e.target.value)} />
            </Veld>
            <Veld label="Wind (Bft)">
              <input type="number" min={0} max={12} value={windBft} onChange={(e) => setWindBft(clamp(+e.target.value || 0, 0, 12))} style={inputStyle} />
            </Veld>
            <Veld label="Duur (min)">
              <input type="number" min={20} max={720} step={10} value={duurMin} onChange={(e) => setDuurMin(clamp(+e.target.value || 20, 10, 1440))} style={inputStyle} />
            </Veld>
            <Veld label="Gewicht (kg)">
              <input type="number" min={40} max={150} value={gewicht}
                onChange={(e) => { const g = clamp(+e.target.value || 75, 30, 200); setGewicht(g); bewaar({ gewicht: g }); }} style={inputStyle} />
            </Veld>
            <Veld label="Bidons mee">
              <input type="number" min={1} max={4} value={bidons} onChange={(e) => setBidons(clamp(+e.target.value || 2, 1, 4))} style={inputStyle} />
            </Veld>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: C.grijs }}>Wat voor rit wordt het?</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(ZONES).map(([z, info]) => {
                const actief = intensiteit === z;
                return (
                  <button key={z} onClick={() => setIntensiteit(z)}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8,
                      width: "100%", padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      textAlign: "left", fontFamily: font,
                      background: actief ? C.navy : C.wit,
                      border: `1.5px solid ${actief ? C.navy : C.lijn}`,
                    }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: actief ? C.goud : C.navy }}>{info.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 11, color: actief ? "#AEB9C6" : C.grijs, textAlign: "right" }}>{info.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={planRit}
            style={{
              width: "100%", marginTop: 16, padding: "13px", borderRadius: 10, border: "none", cursor: "pointer",
              background: C.goud, color: C.wit, fontFamily: font, fontWeight: 800, fontSize: 16,
            }}>
            Stel de ploegorder op
          </button>
        </section>

        {advies && (
          <section style={kaart}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <h2 style={kop}>Tenue van de dag</h2>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.goudDonker }}>voelt als {advies.kleding.tEff}°</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.grijs }}>
              {tGevoel}° buiten{dt !== 0 ? `, ${dt > 0 ? "plus" : "min"} ${Math.abs(dt)}° omdat je ${dt > 0 ? "gaat stampen" : "de benen laat draaien"}` : ""}{uBias !== 0 ? `, ${uBias > 0 ? "plus" : "min"} ${Math.abs(uBias)}° van jouw thermostaat` : ""}.
            </p>
            <TempBalk tEff={advies.kleding.tEff} />

            {advies.kleding.waarschuwingen.map((w, i) => (
              <p key={i} style={{ marginTop: 12, marginBottom: 0, padding: "10px 12px", borderRadius: 10, background: "#F9ECEC", color: C.rood, fontWeight: 600, fontSize: 13 }}>{w}</p>
            ))}

            <div style={{ marginTop: 14 }}>
              {Object.entries(advies.kleding.lagen).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ padding: "9px 0", borderBottom: `1px solid ${C.lijn}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.goudDonker, textTransform: "uppercase", letterSpacing: 0.4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1, overflowWrap: "break-word" }}>{v}</div>
                </div>
              ))}
              {advies.kleding.achterzak.map((a) => (
                <div key={a} style={{ padding: "9px 0", borderBottom: `1px solid ${C.lijn}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.grijs, textTransform: "uppercase", letterSpacing: 0.4 }}>Achterzak</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1, overflowWrap: "break-word" }}>{a}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {advies && (
          <section style={{ ...kaart, background: C.navy, border: "none", color: C.wit }}>
            <h2 style={{ ...kop, color: C.wit }}>De bevoorrading</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#AEB9C6" }}>
              Tegen de hongerklop. Lopend naar huis bellen is ook afzien, maar de verkeerde soort.
            </p>
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: "rgba(184,146,74,.16)", border: `1px solid ${C.goud}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.goud }}>{advies.voeding.strategie.titel}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#D5DDE4", marginTop: 2 }}>{advies.voeding.strategie.uitleg}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
              {[
                [advies.voeding.khPerUur, advies.voeding.khPerUur === 0 ? "suikers nodig" : "g/u suikers"],
                [advies.voeding.mlPerUur, "ml/u drinken"],
                [advies.voeding.kcalTotaal, "kcal totaal"],
              ].map(([n, l]) => (
                <div key={l} style={{ padding: "12px 6px", borderRadius: 10, background: "rgba(255,255,255,.07)", textAlign: "center", minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: C.goud }}>{n}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#AEB9C6" }}>{l}</div>
                </div>
              ))}
            </div>
            {advies.voeding.ratio && (
              <p style={{ margin: "10px 0 0", fontSize: 12, fontWeight: 600, color: "#AEB9C6" }}>
                Mix de bidons op {advies.voeding.ratio}, met {advies.voeding.natrium} mg zout per liter tegen de kramp.
              </p>
            )}

            {advies.voeding.musette.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.goud, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  {advies.voeding.geplandKh > 0 ? `In de musette · ${advies.voeding.geplandKh} g koolhydraten` : "Mee in de bidonhouder"}
                </div>
                {advies.voeding.musette.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.goud, textTransform: "uppercase", letterSpacing: 0.4 }}>{SOORT_LABEL[m.soort]}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, overflowWrap: "break-word" }}>{m.naam}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#AEB9C6", overflowWrap: "break-word" }}>{m.detail} · {m.wanneer}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: C.goud }}>{m.aantal}×</div>
                      {m.khTotaal > 0 && <div style={{ fontSize: 11, fontWeight: 600, color: "#AEB9C6" }}>{m.khTotaal} g</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              {advies.voeding.tips.map((t, i) => (
                <p key={i} style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 500, color: "#C6CFD8" }}>{t}</p>
              ))}
            </div>
          </section>
        )}

        {pendingRide && (
          <section style={{ ...kaart, border: `1.5px solid ${C.goud}` }}>
            <h2 style={kop}>De debriefing</h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: C.grijs }}>
              Terug in de teambus. Hoe was het daarbuiten? Wees eerlijk, de ploegleider stelt je thermostaat erop af.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {ratings.map(({ r, t, uitleg }) => (
                <button key={r} onClick={() => geefFeedback(r)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                    width: "100%", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontFamily: font,
                    background: r === 0 ? C.goudLicht : C.wit,
                    border: `1.5px solid ${r === 0 ? C.goud : C.lijn}`,
                  }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: r < 0 ? "#3D6AA8" : r > 0 ? C.rood : C.goudDonker }}>{t}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.grijs }}>{uitleg}</span>
                </button>
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, fontWeight: 600, color: C.grijs, cursor: "pointer" }}>
              <input type="checkbox" checked={gevolgd} onChange={(e) => setGevolgd(e.target.checked)} />
              Ik volgde de ploegorder (uit = eigen plan getrokken, telt niet mee)
            </label>
          </section>
        )}

        {toast && (
          <p style={{ margin: 0, padding: "12px 16px", borderRadius: 10, background: C.goudLicht, color: C.goudDonker, fontWeight: 700, fontSize: 14, textAlign: "center" }}>{toast}</p>
        )}

        {rides.length > 0 && (
          <section style={kaart}>
            <h2 style={kop}>Het palmares</h2>
            <div style={{ marginTop: 8 }}>
              {rides.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.lijn}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.grijs, minWidth: 0, overflowWrap: "break-word" }}>
                    {new Date(r.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} · {ZONES[r.intensiteit]?.label.toLowerCase() ?? ""} · {r.duurMin} min · {r.tEff}°
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", color: r.rating === 0 ? C.groen : C.goudDonker }}>
                    {r.rating === 0 ? "chapeau" : `${r.rating > 0 ? "+" : ""}${r.rating}${r.delta ? ` → ${r.delta > 0 ? "+" : ""}${r.delta}°` : ""}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {geladen && rides.length === 0 && !advies && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.grijs, textAlign: "center" }}>
            Nog niks op je palmares. Stel je eerste ploegorder op, al is het maar tot de koffiestop en terug.
          </p>
        )}
      </main>

      <footer style={{ background: C.navy, color: "#8E9AA8", textAlign: "center", padding: "24px 16px", fontSize: 12, fontWeight: 500 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: C.wit }}>velo<span style={{ color: C.goud }}>cast</span></span>
        <p style={{ margin: "6px 0 0" }}>Weer via Open-Meteo. Leert per rit bij, met wielrennersgeduld.</p>
      </footer>
    </div>
  );
}
