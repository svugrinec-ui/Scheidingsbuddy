# Mijn Levensbalans

Een persoonlijke app voor de telefoon (PWA) om de komende periode rustig bij te houden hoe het gaat:

- **Wekelijkse check-in** over vier pilaren met elk vier onderdelen: Relatie & verbinding, Wonen & leefomgeving, Werk & financiën en Gezondheid. Per onderdeel geef je een score (1–10), je gevoel (1–10) en de richting (↑ → ↓), plus notities.
- **Focuslijst** met taken die bij een pilaar horen, met stappen. Afvinken laat zien wat je niet meer in je hoofd hoeft te houden.
- **Overzicht** met totaalscore, radar, trends per week en signalen bij een aanhoudende daling. Een lage score alleen geeft geen signaal.
- **Maandelijkse terugblik**, met elk kwartaal een extra vraag.

Alles wordt alleen op het toestel bewaard (localStorage). Via **Terugblik → Back-up** maak je een JSON-back-up en zet je die terug.

Puur HTML, CSS en JavaScript. Geen build-stap en geen afhankelijkheden.

## Lokaal bekijken

```bash
npx serve .        # of: python3 -m http.server 8080
```

## Deployen op Vercel

1. Importeer deze repo in [Vercel](https://vercel.com): **Add New → Project**.
2. Framework Preset: **Other**. Laat de build command en de output directory leeg.
3. Deploy. Klaar. Elke push naar `main` wordt automatisch opnieuw gedeployed.

## Op je telefoon zetten

- **iPhone (Safari):** open de link, tik op Deel → **Zet op beginscherm**.
- **Android (Chrome):** open de link, menu ⋮ → **App installeren**.

Open de app daarna altijd via het icoon op je beginscherm. Daar staan je gegevens.

## Bijwerken

Na een wijziging verhoog je `CACHE` in `sw.js` (bijvoorbeeld `levensbalans-v2`), zodat telefoons de nieuwe versie ophalen.
