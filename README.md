# Scheidingsbuddy

Een persoonlijke app voor de telefoon (PWA) die je helpt de scheiding en de periode erna rustig door te komen. Dit is de eerste versie; de app groeit later uit tot een uitgebreidere buddy.

Wat er nu in zit, de levensbalans:

- **Wekelijkse check-in** over vier pilaren met elk vier onderdelen: Relatie & verbinding, Wonen & leefomgeving, Werk & financiën en Gezondheid. Per onderdeel beantwoord je één scherpe vraag met een cijfer (1–10) en kies je de richting (↑ → ↓), plus notities.
- **Focuslijst** met taken die bij een pilaar horen, met stappen. Afvinken laat zien wat je niet meer in je hoofd hoeft te houden.
- **Overzicht** met totaalscore, radar, trends per week en signalen bij een aanhoudende daling. Een lage score alleen geeft geen signaal.
- **Maandelijkse terugblik**, met elk kwartaal een extra vraag.

- **Buffer en grote uitgaven**: een bufferdoel met voortgang, geplande grote uitgaven met een maandelijkse reservering en een vast maandritme.

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

Na een wijziging verhoog je `CACHE` in `sw.js` (bijvoorbeeld `scheidingsbuddy-v4`), zodat telefoons de nieuwe versie ophalen.
