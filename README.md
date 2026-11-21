# LB Motorpool — After Hours Garage

Mobile Three.js-Fahrzeuggarage mit sechs fest integrierten Fahrzeugen, Neonbeleuchtung, spiegelndem Betonboden, animierten Kameraperspektiven und dem LB-Soundtrack.

**Live:** https://domfie.github.io/lb-garage/

## Lokal entwickeln

Node.js 22 oder neuer:

```sh
npm ci
npm run dev
```

Die lokale Adresse ist `http://127.0.0.1:5173/lb-garage/`.

```sh
npm run check
npm run build
npm run preview
```

## Fahrzeuge & Rechte

Audi A1 Clubsport Quattro, Audi A3 3.2 Quattro, Audi Q7, Audi RS6 Avant, Mercedes-Benz Sprinter Verkehrssicherung und Veranstaltungstechnik. Die echten Fahrzeugdateien werden mit dem Projekt ausgeliefert. Kein manueller Import, kein CDN, keine Registrierung notwendig.

[Urheber, Quellen, Lizenztexte und Änderungen](docs/ASSET-LICENSES.md) · [Modellinventar](docs/model-inventory.json)

Alle Modelle sind als GLB mit Meshopt komprimiert, auf Metermaß normalisiert und enthalten ihre Texturen. Die fünf Dateien umfassen zusammen etwa 3,54 MiB; Sprinter-Varianten verwenden dieselbe Basisdatei und eigene Szenenaufbauten. Modelle werden erst bei Auswahl geladen und anschließend zwischengespeichert. Mobile Geräte rendern mit maximal 30 Bildern pro Sekunde und begrenzter Pixeldichte; Hintergrundtabs pausieren die 3D-Darstellung. Reduzierte Bewegung wird respektiert.

Die reproduzierbare Aufbereitung lädt Originale aus festgehaltenen Revisionen, normalisiert sie und prüft die Ergebnisse:

```sh
npm run models
```

Die MP3 wurde vom Projektinhaber zur Einbindung bereitgestellt. Für sie wird keine offene Lizenz behauptet.

## Bedienung

- Fahrzeugkarte, Navigation oder Pfeiltasten: Fahrzeug wechseln; Filter begrenzen die Navigation auf die jeweilige Flotte.
- Ziehen: Kamera drehen. Zwei Finger oder Mausrad: zoomen.
- 360°: langsame Kamerafahrt nach sechs Sekunden ohne Eingabe. Front, Seite und Detail sind feste Kameraperspektiven. Beim RS6 zeigt Detail die rechte Fahrzeugseite mit beschädigten Felgen.
- Play/Pause, Musikposition, Stummschaltung und Lautstärke steuern die lokale MP3. Wiedergabe beginnt erst nach einem Klick.
- Reservierungen werden ausschließlich im jeweiligen Browser gespeichert. Es gibt keinen gemeinsamen Buchungsserver.

## Veröffentlichen & überprüfen

GitHub Actions baut bei Pushes auf `main` mit `npm ci`, prüft alle GLB-Dateien und veröffentlicht `dist/` über GitHub Pages. Vite ist auf den Projektpfad `/lb-garage/` eingestellt. Zusätzlich synchronisiert `npm run build` die fertige Website nach `index.html`, `assets/` und `favicon.svg` im Repository-Stamm. Damit funktioniert die bestehende Pages-Quelle `main / (root)` ebenfalls. `.nojekyll` verhindert eine weitere Quellverarbeitung. Die bearbeitbaren Dateien liegen vollständig unter `src/`; die Stammdateien sind erzeugte Ausgaben. Nach Quelländerungen immer `npm run build` ausführen und die erzeugten Dateien mit committen. Alte JavaScript-Bundles bleiben für bereits offene Browser verfügbar.

`?verify=1` startet auf der lokalen oder veröffentlichten Seite eine sichtbare Integrationsprüfung: alle sechs Fahrzeuge im echten WebGL-Browser laden, Modellabmessungen und Anbauteile prüfen sowie die komplette MP3 mit Web Audio dekodieren. Die Wiedergabe und das Layout werden zusätzlich manuell im Browser geprüft.

## Corporate Design & Fahrzeugwechsel

Die Oberfläche verwendet das offizielle Rautensignet, Poppins und die Navy-/Blau-/Koralle-/Signalgelb-Farben der LB Firmengruppe. Markenquellen und Schriftlizenz sind in der Lizenzdokumentation vermerkt.

Beim Wechsel wird das Fahrzeug etwa 38 cm über der Plattform eingesetzt. Nach dem Bodenkontakt federt die Karosserie relativ zu den Rädern ein und schwingt gedämpft aus. Die Reifen durchdringen dabei die Plattform nicht. Die Federung ist eine visuelle Inszenierung; die Radbereiche werden im Vertexshader ausgespart. Bei aktivierter Einstellung „Bewegung reduzieren“ entfällt die Animation.

Alle Fahrzeuge sind in Firmenblau (`#135379`) lackiert und tragen vorne und hinten das gestaltete Kennzeichen „M- LB XXXX“. An der Garagenwand steht das offizielle Rautensignet auf einer hellen Logotafel.
