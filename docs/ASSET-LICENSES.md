# Fahrzeugmodelle, Quellen und Nutzungsrechte

Geprüft am 21. November 2026. Alle integrierten Fahrzeugmodelle wurden über reguläre, öffentlich zugängliche Downloads beschafft. Für keinen Download waren Anmeldung oder Zahlung erforderlich. Es wurden keine Sketchfab-Viewer-Dateien extrahiert. Die Lizenzangaben der Originalmodelle wurden separat geprüft und als Metadatenbelege gespeichert.

## Integrierte Modelle

| Fahrzeug / Datei | Urheber und Bearbeitung | Lizenz und Originalquelle | Downloadquelle |
|---|---|---|---|
| Audi A1 Clubsport Quattro / `public/assets/models/a1.glb` | Mona x Supercars, zuvor GT Cars: Hyperspeed, derselbe Account `Car2022`; Webaufbereitung: assetscarros3d; LB-Anpassungen siehe unten | [CC BY 4.0](licenses/CC-BY-4.0.txt), [Originalmodell](https://sketchfab.com/3d-models/audi-a1-clubsport-quattro-3f582a018306464ea501aaaec29efd2c), [Urheber](https://sketchfab.com/Car2022) | [assetscarros3d, festgehaltene Revision](https://github.com/nutricionistaalmeidavh-spec/assetscarros3d/blob/3eb0f1afac277d81bca7b7f643de81915ea76965/assets/audi-a1.glb) |
| Audi A3 3.2 DSG Quattro (Type 8P) / `public/assets/models/a3.glb` | Mona x Supercars, zuvor GT Cars: Hyperspeed; Webaufbereitung: assetscarros3d | [CC BY 4.0](licenses/CC-BY-4.0.txt), [Originalmodell](https://sketchfab.com/3d-models/audi-a3-32-dsg-quattro-type-8p-070e6a27527a433baae83f55a40df536), [Urheber](https://sketchfab.com/Car2022) | [assetscarros3d, festgehaltene Revision](https://github.com/nutricionistaalmeidavh-spec/assetscarros3d/blob/3eb0f1afac277d81bca7b7f643de81915ea76965/assets/audi-a3.glb) |
| Audi Q7 (2015) / `public/assets/models/q7.glb` | razor24 (2019), bearbeitet von Dogan Ulus / Veva Labs (2025), für LB normalisiert und komprimiert | [MPL 2.0](licenses/MPL-2.0.txt) **und** [CC BY 4.0](licenses/CC-BY-4.0.txt), [Urheber razor24](https://sketchfab.com/razor24), [Original-/Quelldateien](https://github.com/vevalabs/openx-assets/tree/20261015/src/vehicles/audi_q7_2015), [Lizenzmetadaten](licenses/audi_q7_2015.xoma) | [OpenX Assets Release 20261015](https://github.com/vevalabs/openx-assets/releases/tag/20261015), `openx-assets-glb.zip` |
| Audi RS6 Cabrio-Umbau auf Basis RS 6 Avant (C8) / `public/assets/models/rs6.glb`, Lampentextur `public/assets/textures/rs6-lamps.png` (zusätzlich im GLB eingebettet) | Mona x Supercars; Konvertierung und Umfärbung durch DeniSpasovski/mini-games; LB: Zusammenbau, Materialien, Komprimierung | [CC BY 4.0](licenses/CC-BY-4.0.txt), [Originalmodell](https://sketchfab.com/3d-models/audi-rs-6-avant-c8-99aa71f747b0453eb58334414d34397c), [Urheber](https://sketchfab.com/Car2022) | [mini-games, Modellbearbeitung und Urhebernachweise](https://github.com/DeniSpasovski/mini-games/blob/47369ee8cc2b61a57f5b15cb70f627a8d1b94208/src/games/rally/cars/audi-rs6/README.md); `public/models/cars/audi_rs6.glb`, `audi_rs6_wheel.glb`, `audi_rs6_lamps.png` aus derselben Revision |
| Mercedes-Benz Sprinter W906 (2006), mittlerer Radstand/Hochdach / `public/assets/models/sprinter.glb`, verwendet für beide LB-Varianten | Max / Max-7215 (2022), bearbeitet von Dogan Ulus / Veva Labs (2026); LB: Variantenaufbauten und Gestaltung | [MPL 2.0](licenses/MPL-2.0.txt) **und** [CC BY 4.0](licenses/CC-BY-4.0.txt), [Urheber Max](https://sketchfab.com/Max-7215), [Original-/Quelldateien](https://github.com/vevalabs/openx-assets/tree/20261015/src/vehicles/mercedes_sprinter_2006), [Lizenzmetadaten](licenses/mercedes_sprinter_2006.xoma) | [OpenX Assets Release 20261015](https://github.com/vevalabs/openx-assets/releases/tag/20261015), `openx-assets-glb.zip` |

Die Fahrzeugbezeichnungen und Marken gehören ihren jeweiligen Inhabern. Die Modelllizenzen begründen keine Herstellerpartnerschaft oder Empfehlung. Die Urhebernachweise gelten auch für die angepassten und optimierten Dateien. CC BY 4.0 gestattet Änderungen, öffentliche Weitergabe und kommerzielle Nutzung bei korrekter Namensnennung und Kennzeichnung der Änderungen. Die OpenX-Modelle behalten zusätzlich ihre MPL-2.0-Bedingungen; ihre bearbeitbare ursprüngliche Form ist über die oben verlinkten öffentlichen `.blend`-Quelldateien verfügbar. Die LB-Transformationen liegen im Repository als Quellcode vor.

## Nachvollziehbare LB-Bearbeitungen

[`scripts/prepare-assets.mjs`](../scripts/prepare-assets.mjs) lädt fehlende Originaldateien aus den festgehaltenen Revisionen und erstellt die eingebundenen GLBs reproduzierbar. Die Modelle werden auf Metermaß, +Y oben, +Z Fahrtrichtung und Bodenkante y=0 normiert. Sie erhalten mittige x-/z-Ursprünge. Geometrien und Materialien werden dedupliziert, kompatible Flächen zusammengelegt, quantisiert und mit Meshopt komprimiert. Texturen bleiben im GLB eingebettet; es bestehen keine externen Texturabhängigkeiten.

- A1: Linien-/Konstruktionskanten entfernt, sichtbare Dreiecksflächen erhalten, fehlerbegrenzte Vereinfachung. Dies ist der dreitürige Clubsport Quattro, kein Sportback.
- A3: Größe auf 4,21 m Länge korrigiert. Originale Lack- und Texturzuweisungen erhalten.
- Q7/Sprinter: Fahrtrichtung von +X auf +Z gedreht, Materialfarben erhalten.
- RS6: Upstream-Karosserie mit vier Kopien der passenden Felge/Reifengeometrie zusammengesetzt, Felgen vereinfacht, realistische PBR-Materialwerte ergänzt, originale Lampentextur eingebettet. Upstream entfernte Markenembleme, Kennzeichen, Motorraum und Bremsdetails werden nicht als vorhanden behauptet. Das lizenzierte Ausgangsmodell ist ein Avant. Auf Wunsch des Projektinhabers wird daraus ein eigener Cabrio-Umbau: Dach, hintere Scheiben und hintere Dachsäulen entfernt; Windschutzscheibe und A-Rahmen erhalten; Heckabdeckung und obere Karosserieabschlüsse ergänzt. Die Bearbeitung ist in `scripts/rs6-cabrio.mjs` reproduzierbar dokumentiert und bleibt eine CC-BY-Ableitung. Die auffälligen Schäden an beiden rechten Felgen werden in der Three.js-Szene ergänzt.
- Sprinter: Verkehrssicherung und Veranstaltungstechnik nutzen dasselbe lizenzierte Basismodell mit eigenen LB-Beschriftungen und Anbauteilen in der Szene.

Das Modellinventar mit tatsächlichen Bounds, Materialnamen, Dreieckszahlen und Dateigrößen liegt in [`model-inventory.json`](model-inventory.json). Rechts in Fahrtrichtung ist bei +Z als Vorwärtsachse die Seite **-X**. Der RS6 enthält benannte Radgruppen `wheel_front_right` und `wheel_rear_right` für diese Seite. Alle Normalisierungstransformationen sind bereits im GLB enthalten; beim Laden nicht nochmals Achsen oder Maße erraten.

## Musik

„LB I Do – The LB Guarantee – Treblo“ wurde vom Nutzer als MP3 für die ausdrückliche Integration und Veröffentlichung in diesem Projekt bereitgestellt. Diese Aufnahme hat hier **keine** behauptete Creative-Commons- oder Open-Source-Lizenz. Die technische Einbindung verleiht Dritten keine weiteren Nutzungsrechte. Die Datei wird unter `public/assets/audio/lb-i-do.mp3` ausgeliefert; Originaltitel und Urheberbezeichnung werden im Player angezeigt.

## Nicht verwendete Kandidaten

Modelle mit bloßem „Free Download“ ohne nachgewiesene Weitergaberechte, persönliche Nutzungslizenzen, aus anderen Spielen kopierte Modelle und ungeklärte Urheber wurden ausgeschlossen. Insbesondere wurde der RS6 aus `lukaizj/car-mod-saas` verworfen, weil dessen Nachweis selbst von einer ungeklärten Lizenz spricht. Ein öffentliches Sprinter-GLB aus `eldinor/ForBJS` wurde wegen fehlender Herkunfts- und Lizenzangaben nicht integriert.

## Lizenzbelege

[`licenses/a1-source.json`](licenses/a1-source.json), [`licenses/a3-source.json`](licenses/a3-source.json) und [`licenses/rs6-source.json`](licenses/rs6-source.json) enthalten die separat abgerufenen Original-Lizenzmetadaten. Die `.xoma`-Dateien sind die unveränderten OpenX-Metadaten einschließlich Copyrightangaben. Vollständige Lizenztexte sind in diesem Ordner enthalten.

## LB Corporate Design

Die Gestaltung folgt auf Wunsch des Projektinhabers dem öffentlich sichtbaren CI der [offiziellen LB Firmengruppe](https://www.lb-firmengruppe.de/). Deren Stylesheet verwendet `#0d1f37` / `#1e4268` (Navy-Verlauf), `#135379` (Blau), `#ff6148` (Koralle) und `#d4f357` (Signalgelb). Diese Farben wurden für Oberfläche und Garagenbeleuchtung übernommen.

- [Offizielles Rautenzeichen](https://www.lb-firmengruppe.de/wp-content/uploads/2026/06/logo.svg), lokal `public/assets/brand/lb-firmengruppe.svg`; zur Darstellung in Markenblau eingefärbt. Das Zeichen und die LB-Marken gehören der Firmengruppe. Keine freie Weiterverwendungslizenz wird behauptet; die Einbindung dient ausschließlich der ausdrücklich gewünschten LB-Markenpräsentation.
- Poppins Regular, SemiBold und Bold: lokal bereitgestellte Webfonts aus der offiziellen LB-Website, lizenziert unter der [SIL Open Font License](licenses/Poppins-OFL.txt). Urheber: Indian Type Foundry / Poppins Project Authors. [Originales Schriftprojekt](https://github.com/itfoundry/Poppins).
- Die Sprinter-Beschriftungen und das Garagenlogo werden für die LB-Varianten aus Text und dem Rautensignet gezeichnet.

Alle sechs LB-Fahrzeugvarianten tragen auf Wunsch des Projektinhabers den offiziellen blauen Farbton `#135379`. Der Verkehrssicherungs-Sprinter behält kontrastierende Warnmarkierungen; die Firmenbeschriftungen sind Weiß auf Blau. Die Garagenwand verwendet das lokal ausgelieferte offizielle Rautensignet statt eines beschnittenen Schriftzugs.

## Modell-Embleme

Die eingeblendeten Modellschriftzüge für A1, A3, Q7, RS6 und Sprinter sind eigens erstellte SVG-Gestaltungen mit Chromverlauf, Kontur und Schatten (`scripts/build-badges.mjs`). Das rote RS-Feld und die Chromanmutung orientieren sich an der vom Nutzer verlinkten [RS6-Emblem-Bildvorlage](https://m.media-amazon.com/images/I/61gFFNcGcML.jpg). Das Amazon-Produktfoto wird nicht in der Website verteilt. Die Schriftzüge sind eigene stilisierte Darstellungen zur Fahrzeugidentifikation, keine als authentisch ausgegebenen Hersteller-Logodateien. Markenrechte bleiben bei den jeweiligen Inhabern.
