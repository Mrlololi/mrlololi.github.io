# Ratgeber: Format der Artikel

Nicht veröffentlicht, solange in `src/config.json` `"ratgeber_live": false` steht. Dateien, die mit `_` beginnen (wie diese), werden nie gebaut.

Ein Artikel ist eine Datei `slug.md` in diesem Ordner:

```
---
title: Titel des Artikels (H1 und <title>)
description: Meta-Beschreibung, höchstens 155 Zeichen
slug: url-des-artikels
datePublished: 2026-11-02
dateModified: 2026-11-05
package: spam
---
Einleitung.

## Abschnitt (erscheint im Inhaltsverzeichnis)

Text mit **fett**, *kursiv*, `Code` und [Link](/launch-technik/).

### Unterabschnitt

- Punkt
- Punkt
```

`package` ist der Schlüssel der passenden Leistungsseite: `launch`, `spam`, `activecampaign`, `ki` oder `website`. Daraus entsteht der CTA-Kasten am Ende.

Optional (beide nur mit dem Wert `true`):

- `tax: true` fügt am Ende den Kasten «Dieser Beitrag dient der allgemeinen Information und ersetzt keine Steuer- oder Rechtsberatung. Stand: {Monat Jahr}.» ein. Monat und Jahr kommen aus `dateModified`.
- `affiliate: true` zeigt «Enthält Werbung / Affiliate-Links» direkt unter dem Titel.
