# velocast

**Afzien mag, afkoelen niet.**

Kleding- en voedingsadvies voor wielrenners, op basis van het actuele weer op je vertrekpunt. De app leert per rit of jij een koukleum of een kacheltje bent en past het advies daarop aan.

## Publiceren op Vercel

Deze repository is een statische site. Er valt niets te bouwen, dus er kan ook niets misgaan in een buildstap.

1. Push deze repository naar GitHub.
2. Ga naar vercel.com → **Add New → Project** → kies je repository.
3. Bij **Framework Preset** kies **Other**. Laat Build Command en Output Directory leeg.
4. Klik **Deploy**.

Je site staat binnen een halve minuut online. De hele app zit in `index.html`: één bestand, geen afhankelijkheden, geen buildstap.

## Zelf aanpassen

De leesbare broncode staat in `source/`. Aanpassen en opnieuw bouwen:

```bash
cd source
npm install
npm run dev      # ontwikkelen op http://localhost:5173
npm run build    # bouwt naar source/dist/
```

Na het bouwen vervang je de `index.html` in de hoofdmap door de gebundelde versie (of laat je de app gewoon vanuit `source/dist/` publiceren; zet in Vercel dan Root Directory op `source` en Framework op Vite).

## Wat de app doet

- **Tenue van de dag** — van basislaag tot overschoenen, op basis van gevoelstemperatuur, wind, regenkans en ritintensiteit.
- **De bevoorrading** — hoeveel koolhydraten per uur, en concreet wat er in je musette gaat: bidons, repen, bananen, rijstwafels, dadels, gels, blokjes. Ritten waarop je niets hoeft te eten worden ook als zodanig benoemd.
- **Zelflerende thermostaat** — na elke rit geef je aan hoe het voelde (IJspegel tot Gaargekookt). Die feedback verschuift je persoonlijke bias, met demping zodat één rotdag het model niet omgooit.
- **Weer op locatie** — via plaatsnaam of GPS.

## Hoe het advies tot stand komt

```
T_effectief = T_gevoel + ΔT_intensiteit + U_bias
```

| Intensiteit | ΔT | Reden |
|---|---|---|
| Koffierit (Z1) | −2 °C | weinig eigen warmte, je koelt uit |
| Duurrit (Z2) | 0 °C | referentie |
| Kuitenbijter (Z3–4) | +3 °C | je stookt zelf mee |
| Koers! (Z5+) | +6 °C | een wedstrijd op 8° voelt als een duurrit op 14° |

`T_effectief` valt in een kledingband van 5 °C breed, met aparte regels voor regen (vanaf 60% kans) en wind (vanaf 5 Bft).

De leerlus gebruikt een leersnelheid van 0,5, begrensd op ±5 °C. Eén rit verschuift je thermostaat dus hooguit 1 °C. Na twintig beoordelingen zakt de leersnelheid naar 0,25. Geef je aan dat je iets anders droeg dan geadviseerd, dan telt die rit niet mee.

## Weerdata en opslag

Het weer komt van [Open-Meteo](https://open-meteo.com) — gratis, geen sleutel nodig. De coördinaten van ruim vijftig Nederlandse plaatsen zitten ingebouwd, dus opzoeken kan meestal zonder externe zoekdienst.

Je profiel (thermostaat, gewicht, plaats, palmares) staat in de `localStorage` van je eigen browser. Er gaat niets naar een server; geen account, geen backend.

## Licentie

MIT
