// All German copy. Source: CONTENT.md (verbatim). To change a price or a sentence,
// edit it here AND in en.mjs, then run `npm run build`.
// EMAIL, UID and URLs come from src/config.json.

export default {
  lang: 'de',
  locale: 'de-AT',
  ogLocale: 'de_AT',
  paths: { home: '/', legal: '/impressum/', privacy: '/datenschutz/' },

  meta: {
    title: 'Marketing-Automation & Launch-Technik aus Graz | mrlololi',
    description: 'Ich baue und betreue die Technik hinter Online-Kursen: ActiveCampaign, Zapier, Landingpages, Zahlungen. Marketing-Automation und Launch-Technik aus Graz.',
  },
  legalMeta: {
    title: 'Impressum - Iva Tsatskrialashvili',
    description: 'Impressum und Offenlegung gemäß § 25 Mediengesetz von Iva Tsatskrialashvili, Werbeagentur in Graz.',
  },
  privacyMeta: {
    title: 'Datenschutzerklärung - Iva Tsatskrialashvili',
    description: 'Datenschutzerklärung der Website von Iva Tsatskrialashvili: keine Cookies, keine Analyse, Hosting bei GitHub Pages.',
  },
  notFoundMeta: {
    title: 'Seite nicht gefunden - Iva Tsatskrialashvili',
    description: 'Diese Seite gibt es nicht.',
  },

  // Small interface strings that CONTENT.md does not cover (accessibility, structure).
  ui: {
    skip: 'Zum Inhalt springen',
    newTab: '(öffnet in neuem Tab)',
    menu: 'Menü',
    navLabel: 'Hauptnavigation',
    footerNavLabel: 'Rechtliches und Sprache',
    wordmarkName: 'Iva Tsatskrialashvili, Startseite',
    langShort: 'EN',
    langName: 'English',
    langCode: 'en',
    details: 'Details',
    problem: 'Problem',
    fix: 'Lösung',
    lastUpdated: 'Stand',
    caseImageAlt: 'Startseite von alexandrafry.ch',
    translation: 'Übersetzung:',
    priceListLabel: 'Preisliste',
    matching: "Passendes Paket:",
    pause: 'Animation anhalten',
    play: 'Animation fortsetzen',
    example: 'Beispiel',
  },

  // Stage 6: four items, «Projekte» is the compact row of own projects.
  nav: [
    { label: 'Leistungen', href: '#services' },
    { label: 'Projekte', href: '#projects' },
    { label: 'Über mich', href: '#about' },
    { label: 'Kontakt', href: '#contact' },
  ],

  hero: {
    eyebrow: 'Für Online-Kursanbieter:innen im DACH-Raum',
    h1: 'Die Technik hinter Ihrem *Kurs-Launch.*',
    lead: 'Ich verbinde Formular, E-Mail-Tool, Zahlung und Kursplattform und teste alles vorher, damit beim Verkaufsstart keine Anmeldung verloren geht. Feste Preise ab 190 €.',
    primary: 'Kostenloses Erstgespräch',
    secondary: 'Preise ansehen',
    micro: '20 Minuten · Antwort in 2 Werktagen',
    trust: 'Aus Graz, remote im DACH-Raum · Marketing-Automation seit 2023 · Gewerbe in Österreich',
    ribbon: 'Anmeldung eingegangen · E-Mail bestätigt · Tag gesetzt · Zahlung erhalten · Zugang frei · Willkommens-Mail angekommen ·',
    flow: {"label":"Ablauf: Formular, ActiveCampaign, Zahlung, Kurs offen","nodes":["Formular","ActiveCampaign","Zahlung","Kurs offen"],"lines":["Die Anmeldung kommt herein und wird geprüft.","Kontakt und Tag werden gesetzt, die Willkommens-Mail wird verschickt.","Zahlung oder Rate wird erkannt, die Rechnung geht raus.","Der Zugang wird freigeschaltet, ohne Handarbeit."],"chip":"Hallo, ich bin Iva"},
  },

  tools: {
    label: 'Ich arbeite mit',
    items: ["ActiveCampaign","Zapier","Make","Leadpages","Stripe","Quaderno","Somba","WordPress","Wix","Google Apps Script"],
  },

  story: {
    "label": "Ablauf in drei Schritten",
    "steps": [
      "Eine Anmeldung kommt herein",
      "Die Automation läuft",
      "Ihre Teilnehmerin ist drin"
    ],
    "form": {
      "title": "Anmeldung zum Herbst-Kurs",
      "fields": [
        [
          "Name",
          "Anna K."
        ],
        [
          "E-Mail",
          "anna@example.com"
        ]
      ],
      "note": "Nur eine Vorschau: Es wird nichts gesendet oder gespeichert.",
      "error": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      "button": "Jetzt anmelden"
    },
    "runLabel": "Beispiel-Durchlauf",
    "welcome": {
      "subject": "Willkommen im Kurs, {first}!",
      "text": "Ihr Zugang ist bereit. Viel Freude beim Lernen.",
      "access": "Kurszugang: freigeschaltet"
    },
    "toasts": [
      "Neue Anmeldung: {name}",
      "Zahlung erhalten: 297 €",
      "Kurszugang freigeschaltet",
      "Willkommens-Mail zugestellt"
    ]
  },

  run: {
    h2: "Was passiert, wenn sich jemand *anmeldet*",
    title: "Ablauf: Neue Kursanmeldung",
    steps: [
      { text: "Anmeldung über das Formular", seconds: 0.2 },
      { text: "E-Mail-Adresse bestätigt", seconds: 0.6 },
      { text: "Kontakt in ActiveCampaign angelegt", seconds: 0.9 },
      { text: "Zahlung erhalten, Rechnung erstellt", seconds: 1.4 },
      { text: "Kurszugang freigeschaltet", seconds: 1.9 },
      { text: "Willkommens-Mail angekommen", seconds: 2.3 },
    ],
    summary: "6 Schritte, 2,3 Sekunden, 0 Fehler (vereinfachtes Beispiel)",
    replay: "Nochmal abspielen",
  },

  problems: {
    h2: "Wo es bei Launches *meistens hakt*",
    intro: "Typische Stellen, an denen Launches haken.",
    slider: {
      label: 'Vorher / Nachher ziehen',
      before: 'Chaos',
      after: 'Geordnet',
      valuetext: 'Vorher {v} %',
      alt: 'Vorher: Formular, ActiveCampaign, Zapier, Stripe und Kurs kreuz und quer verbunden, drei Verbindungen gerissen. Nachher: dieselben Werkzeuge in einem klaren Ablauf.',
      nodes: ['Formular', 'ActiveCampaign', 'Zapier', 'Stripe', 'Kurs'],
    },
    items: [
      { problem: "Anmeldungen verschwinden zwischen Formular und CRM.", fix: "Ich baue Abläufe, die jede Anmeldung prüfen und bei Fehlern automatisch neu senden, auch wenn viele gleichzeitig kommen.", pkg: "launch" },
      { problem: "Launch-Mails landen im Spam.", fix: "SPF, DKIM und DMARC richtig einrichten und die Zustellung testen.", pkg: "quick" },
      { problem: "Die Ratenzahlung ist fehlgeschlagen, der Zugang bleibt trotzdem offen.", fix: "Automatische Erinnerungen, Sperre und Freischaltung, abgestimmt mit Quaderno, Somba oder Stripe.", pkg: "launch" },
    ],
  },

  pricing: {
    h2: 'Leistungen und *Preise*',
    intro: 'Feste Preise, klarer Umfang. Ich arbeite mit wenigen Kund:innen gleichzeitig, an ein bis zwei Tagen pro Woche, und dafür mit voller Aufmerksamkeit.',
    groups: [
      {
        "title": "Zum Einstieg",
        "items": [
          {
            "id": "quick",
            "name": "Quick-Fix",
            "price": "190 € fix",
            "summary": "Eine konkrete Aufgabe mit bis zu 4 Stunden Aufwand: DNS- und E-Mail-Einträge (SPF, DKIM, DMARC), defekte Links oder Formulare, Termine oder eine Automation."
          },
          {
            "id": "check",
            "name": "Technik-Check",
            "price": "290 € fix",
            "summary": "Ein Tag Analyse mit Lesezugriff: ActiveCampaign, Zapier oder Make, Zahlung, Landingpages, Double-Opt-In und Einwilligungen.",
            "details": "Sie bekommen eine Liste mit Prioritäten, Aufwand und Preisen und ein Gespräch von 45 Minuten. Beauftragen Sie innerhalb von 30 Tagen ein Projekt, rechne ich die 290 € voll an."
          }
        ]
      },
      {
        "title": "Projekte",
        "note": "Festpreis nach dem Briefing.",
        "items": [
          {
            "id": "launch",
            "name": "Launch-Setup",
            "price": "ab 1.190 €",
            "bullets": ["Landingpages und Checkout", "ActiveCampaign-Abläufe für Anmeldung, Erinnerung, Start, Onboarding und Zahlungsausfall", "Formulare mit Double-Opt-In und Tags", "Verbindungen über Zapier oder Apps Script zu CRM und Mitgliederbereich", "Kurs-Einrichtung in Somba, Skool oder Circle, Zoom und Kalender"],
            "summary": "Zum Verkaufsstart ist alles startklar."
          },
          {
            "id": "website",
            "name": "Website als One-Pager",
            "price": "ab 990 €",
            "summary": "Wix, Leadpages oder eigenes HTML, responsiv, mit Calendly, Cookie-Banner, SEO-Grundlagen, Impressum und Datenschutz, Domain, Veröffentlichung, Übergabe-Gespräch und drei Korrekturschleifen."
          },
          {
            "id": "ki",
            "name": "KI im Kundenservice",
            "price": "ab 590 €",
            "summary": "Wissensbasis aus Ihren FAQ und Kursregeln, Ablauf in Make oder Zapier, Antwortentwürfe mit Thema und Dringlichkeit in GrooveHQ, Gmail oder Help Scout, Test mit 50 Beispiel-E-Mails aus Ihrem Postfach, anonymisiert, Übergabe. Es entstehen nur Entwürfe: Ihr Team prüft und versendet jede Antwort selbst. Den Datenschutz klären wir vor dem Start, mit einem KI-Anbieter, der Daten in der EU verarbeitet, wo möglich.",
            "extra": {
              "label": "Optional: Pflege 90 € pro Monat",
              "text": "monatlich kündbar: bis 2 Stunden für Wissensbasis, Qualitätskontrolle und einen kurzen Bericht zur gesparten Zeit; darüber 45 € pro Stunde; API-Kosten zahlen Sie direkt."
            },
            "calc": true
          }
        ]
      },
      {
        "title": "Laufende Betreuung",
        "items": [
          {
            "id": "support",
            "name": "Betreuung nach Stunden",
            "price": "45 € pro Stunde",
            "summary": "Ab 5 Stunden im Monat: Pflege Ihrer Automationen, kleine Landingpages, Fehlerbehebung. Abrechnung am Monatsende nach Stunden."
          }
        ]
      }
    ],
    cta: "Anfragen",
    subjectPrefix: "Anfrage: ",
    hourly: "Alles außerhalb der Pakete: 45 € pro Stunde.",
    promise: "Zusätzlich zur gesetzlichen Gewährleistung: Läuft ein von mir gebauter Ablauf in den ersten 30 Tagen nicht wie vereinbart, behebe ich das ohne Berechnung. Das gilt für meine Arbeit, nicht für Ausfälle der Tools selbst.",
    smallPrint: 'Alle Preise sind Endpreise. Als Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG weise ich keine Umsatzsteuer aus. Bei Unternehmen mit gültiger UID in einem anderen EU-Mitgliedstaat geht die Steuerschuld auf den Leistungsempfänger über (Reverse Charge).',
  },

  ki: {
    "h3": "Von der verärgerten Kundenmail zum fertigen *Entwurf*",
    "from": "Anna K.",
    "mail": "hallo ich hab den kurs gekauft aber kein login bekommen??? und die rechnung fehlt auch. echt ärgerlich, brauche das bis morgen!!",
    "marks": [
      "kein login bekommen",
      "die rechnung fehlt",
      "echt ärgerlich",
      "bis morgen"
    ],
    "chips": [
      "Thema: Login",
      "Rechnung fehlt",
      "Stimmung: verärgert",
      "dringend"
    ],
    "pill": "Entwurf wird erstellt…",
    "toneLabel": "Tonfall",
    "tones": [
      [
        "Sie",
        "Liebe Anna, danke für Ihre Nachricht und entschuldigen Sie den Ärger. Ihren Zugang habe ich neu verschickt, die Rechnung finden Sie im Anhang. Bei Fragen bin ich gern da."
      ],
      [
        "du",
        "Liebe Anna, danke für deine Nachricht und sorry für den Ärger. Deinen Zugang habe ich neu verschickt, die Rechnung findest du im Anhang. Melde dich gern bei Fragen."
      ],
      [
        "locker",
        "Hi Anna! Sorry für das Chaos. Zugang ist neu unterwegs, Rechnung hängt dran. Schreib einfach, wenn noch was fehlt."
      ]
    ],
    "buttons": [
      "Freigeben",
      "Bearbeiten"
    ],
    "note": "Versendet wird erst nach Freigabe durch Ihr Team.",
    "approved": "Freigegeben",
    "sent": "Antwort an Anna gesendet (Beispiel)",
    "done": "Fertig",
    "editLabel": "Antwort bearbeiten",
    "replay": "Nochmal",
    "caption": "Die Entwürfe klingen nach Ihnen.",
    "speed": {
      "label": "Beispielwerte",
      "slow": "Von Hand: ca. 6 Minuten pro Antwort",
      "fast": "Mit Entwurf: ca. 1 Minute zum Prüfen"
    }
  },

  calc: {
    h3: 'Wie viel Zeit kostet Sie Ihr Postfach?',
    inputs: [
      { id: 'emails', label: 'E-Mails pro Woche', value: 120, min: 0, max: 5000, step: 1 },
      { id: 'minutes', label: 'Minuten pro Antwort', value: 6, min: 0, max: 120, step: 1 },
      { id: 'share', label: 'Anteil Standardfragen in %', value: 60, min: 0, max: 100, step: 1 },
      { id: 'rate', label: 'Stundensatz Ihres Teams in €', value: 25, min: 0, max: 300, step: 1 },
    ],
    sentence: 'Standardantworten kosten Ihr Team rund {h} Stunden im Monat. Mit Antwortentwürfen sparen Sie etwa {saved_h} Stunden, das sind rund {saved_eur} € pro Monat.',
    note: 'Schätzung. Annahme: Ein geprüfter Entwurf spart 70 % der Zeit pro Standardantwort.',
  },

  finder: {
    "h2": "Welches Paket *passt?*",
    "questions": [
      [
        "Worum geht es?",
        [
          [
            "broken",
            "Etwas funktioniert nicht"
          ],
          [
            "launch",
            "Ich plane einen Launch"
          ],
          [
            "website",
            "Ich brauche eine Website"
          ],
          [
            "inbox",
            "Mein Postfach ist zu voll"
          ]
        ]
      ],
      [
        "Wissen Sie, wo das Problem liegt?",
        [
          [
            "yes",
            "Ja, ziemlich genau"
          ],
          [
            "no",
            "Nein, nicht wirklich"
          ]
        ]
      ],
      [
        "Wann?",
        [
          [
            "soon",
            "In den nächsten 2 Wochen"
          ],
          [
            "later",
            "Später"
          ]
        ]
      ]
    ],
    "result": "Passt am besten: {pkg}",
    "link": "Zum Paket",
    "restart": "Neu starten",
    "closing": {
      "soon": "Schreiben Sie mir gleich.",
      "later": "Gern auch für einen späteren Termin."
    },
    "static": [
      [
        "Etwas funktioniert nicht und Sie wissen, wo",
        "quick"
      ],
      [
        "Sie wissen nicht, wo das Problem liegt",
        "check"
      ],
      [
        "Sie planen einen Launch",
        "launch"
      ],
      [
        "Sie brauchen eine Website",
        "website"
      ],
      [
        "Ihr Postfach ist zu voll",
        "ki"
      ]
    ]
  },

  process: {
    h2: 'So arbeiten wir *zusammen*',
    steps: [
      { title: 'Erstgespräch, 20 Minuten, kostenlos.', text: 'Sie erzählen, was hakt. Ich sage ehrlich, ob ich helfen kann.' },
      { title: 'Quick-Fix oder Angebot.', text: 'Kleine Dinge löse ich direkt, für größere bekommen Sie einen Festpreis.' },
      { title: 'Umsetzung.', text: 'Ich arbeite in Ihren Konten, dokumentiere jeden Schritt und teste mit Testkontakten, bevor echte Anmeldungen durchlaufen.' },
      { title: 'Übergabe.', text: 'Eine schriftliche Anleitung, auf Wunsch ein kurzes Video, damit Ihr Team alles selbst pflegen kann.' },
    ],
  },

  refs: {
    study: {"title":"Fallbeispiel: Online-Kursanbieterin","before":"Vorher","after":"Nachher"},
    h2: 'Arbeit und *Referenzen*',
    case1: {
      domain: 'alexandrafry.ch',
      titleRest: ', Website für eine Executive-Coachin in Bern',
      text: 'One-Pager mit Leadpages: responsives Design, Terminbuchung über Calendly, Cookie-Hinweis, SEO-Grundeinstellungen, Rechtsseiten, Domain und Übergabe-Gespräch.',
      quote: {
        lang: 'de',
        text: 'Sehr gerne bestätige ich, dass Iva Tsatskrialashvili diese Aufgabe hervorragend erfüllt und die Erwartungen übertroffen hat.',
        source: 'Alexandra Fry, Geschäftsführerin FRY-CPC GmbH, Bern',
      },
    },
    case2: {
      title: 'Launch-Technik für eine Online-Kursanbieterin, seit April 2026',
      text: 'ActiveCampaign- und Zapier-Abläufe für Anmeldung, Launch, Onboarding und Zahlungserinnerungen, Landingpages in Leadpages, Rechnungen, Ratenzahlungen und Kurszugänge mit Quaderno und Somba, Live-Termine mit Zoom und Ecamm.',
    },
    case3: {
      title: 'E-Commerce für zwei deutsche Onlineshops, zweieinhalb Jahre',
      text: 'Relaunch zweier Onlineshops, Produktdaten und SEO-Inhalte in CMS- und PIM-Systemen, Markt- und Wettbewerbsanalysen und Auswertungen der Shop-Statistiken.',
      quote: {
        lang: 'de',
        text: '[…] halten wir Iva Tsatskrialashvili als Dienstleister für Projekte im Bereich Online Marketing und E-Commerce für sehr qualifiziert und möchten ihn ohne jegliche Vorbehalte an potenzielle Auftraggeber weiterempfehlen.',
        source: 'Ditoma GmbH, Ludwigsburg',
      },
    },
    quote4: {
      lang: 'en',
      text: 'He was also highly adaptable, quickly learning new tools and processes specific to each project.',
      translation: 'Er war außerdem sehr anpassungsfähig und hat sich schnell in die Tools und Abläufe des jeweiligen Projekts eingearbeitet.',
      source: 'Tamar Tsvimitidze, Operations Manager, CMX Solutions (Kundensupport-Dienstleister)',
    },
  },

  about: {
    h2: 'Über *mich*',
    photoAlt: 'Iva Tsatskrialashvili',
    // Stage 6: two short paragraphs (shortened from the three before, nothing new).
    paragraphs: [
      'Ich bin Iva Tsatskrialashvili (er/ihm) und lebe in Graz. Ich habe Informationstechnologie studiert und studiere jetzt berufsbegleitend Marketing & Sales an der FH CAMPUS 02. So verstehe ich beides: den Funnel und die API dahinter.',
      'Seit 2023 arbeite ich für Kund:innen in Deutschland, der Schweiz, Italien und Österreich, zuerst für Onlineshops, seit 2026 auch für eine Online-Kursanbieterin. Mein Gewerbe ist in Österreich angemeldet: ordentliche Rechnungen, ein fester Ansprechpartner.',
    ],
    tools: 'ActiveCampaign, Zapier, Make, Google Apps Script, Leadpages, WordPress, Wix, Shopware, Stripe, Quaderno, Somba, GrooveHQ, Canva, HTML, CSS, JavaScript, Python, SQL',
    path: ['Tbilisi', 'DACH-Vertrieb ab 2020', 'Erasmus+ in 11 Ländern', 'Graz seit 2025'],
    pathLabel: 'Mein Weg',
    projects: 'Eigene Projekte: GeoAPP und KittyCats',
  },

  notdo: {"label":"Was ich nicht mache:","text":"Werbetexte schreiben, Werbeanzeigen schalten oder Ihren Kundensupport übernehmen. Dafür empfehle ich Ihnen gern Kolleg:innen."},

  faq: {
    typing: "tippt…",
    h2: 'Häufige *Fragen*',
    items: [
      { q: 'Muss ich mich mit Technik auskennen?', a: 'Nein. Sie sagen mir, was passieren soll, ich kümmere mich um den Rest und erkläre alles in einfachen Worten.' },
      { q: 'Arbeiten Sie auch remote?', a: 'Ja. Fast alle Projekte laufen remote im DACH-Raum. In Graz komme ich gern persönlich vorbei.' },
      { q: 'Wie schnell können Sie starten?', a: 'Quick-Fixes meist innerhalb einer Woche. Projekte nach Absprache, weil ich bewusst nur wenige gleichzeitig annehme.' },
      { q: 'Brauche ich bestimmte Tools?', a: 'Nein. Ich arbeite mit dem, was Sie schon haben, und schlage einen Wechsel nur vor, wenn er sich rechnet.' },
      { q: 'Wie gehen Sie mit Daten um?', a: 'Ich bekomme einen eigenen Benutzerzugang statt Ihres Passworts. Nach Projektende entfernen Sie meinen Zugang, und ich lösche die Kopien Ihrer Daten, die bei mir liegen.' },
      { q: 'Übernehmen Sie auch den Kundensupport?', a: 'Nein. Ich baue die Technik, die Ihren Support entlastet, zum Beispiel Antwortentwürfe für wiederkehrende Fragen.' },
      { q: 'Sind Sie am Launch-Tag erreichbar?', a: 'Ja, nach Absprache: Den Launch-Tag und ein Zeitfenster legen wir vorher fest. Vorher testen wir jeden Zahlungsfall im Testmodus.' },
      { q: 'Was, wenn mein Problem in kein Paket passt?', a: 'Schreiben Sie mir kurz, was nicht funktioniert. Sie erfahren den Preis, bevor ich anfange.' },
    ],
  },

  contact: {
    h2: 'Erzählen Sie mir, *was hakt.*',
    text: 'Ich antworte innerhalb von zwei Werktagen.',
    free: 'Das Erstgespräch (20 Minuten) ist kostenlos.',
    mail: 'E-Mail schreiben',
    subject: 'Anfrage%20%C3%BCber%20mrlololi.com',
    booking: 'Termin buchen',
    linkedin: 'LinkedIn',
    malt: 'Malt-Profil',
  },

  // Stage 4 (21.10.2026): copy for the new demos and interfaces (CONTENT.md, section «Stage 4»).
  s4: {
    fixDemo: {
      show: 'Lösung ansehen',
      again: 'Nochmal ansehen',
      signup: { from: 'Formular', to: 'CRM', retry: 'Prüfen + Wiederholen', count: '{n}/47 angekommen', alt: 'Animation: Anmeldungen fliegen vom Formular ins CRM, zwei gehen verloren. Mit «Prüfen + Wiederholen» kommen alle 47 an.' },
      spam: { spam: 'Spam', inbox: 'Posteingang', badges: ['SPF', 'DKIM', 'DMARC'], alt: 'Animation: Eine Launch-Mail landet im Spam. Nach SPF, DKIM und DMARC kommt sie im Posteingang an.' },
      rate: { failed: 'Kartenzahlung fehlgeschlagen', open: 'Kurs offen', steps: ['Erinnerung 1', 'Erinnerung 2', 'Zugang pausiert', 'Zahlung da', 'Zugang wieder offen'], alt: 'Animation: Eine Rate schlägt fehl, der Kurs bleibt offen. Danach: Erinnerung 1, Erinnerung 2, Zugang pausiert, Zahlung da, Zugang wieder offen.' },
    },
    story: {
      screen: 'Beispiel-Bildschirm: Anmeldung, Automation, Postfach und Kursbereich',
      panes: ['Formular', 'Automation', 'Postfach', 'Kursbereich'],
      nodes: [['Trigger', 'Formular'], ['Tag', 'Herbst-Kurs'], ['Mail', 'Bestätigung'], ['Warten', 'bis bestätigt'], ['Zahlung', 'Stripe'], ['Rechnung', 'Quaderno'], ['Zugang', 'Somba']],
      tool: 'E-Mail-Tool',
      mails: [['Bitte bestätigen', 'Ein Klick, dann sind Sie dabei.'], ['Willkommen, {first}!', 'Ihr Zugang ist bereit.']],
      phone: 'Posteingang',
      course: 'Herbst-Kurs',
      locked: 'Gesperrt',
      unlocked: 'Freigeschaltet',
      module: 'Modul 1: Willkommen',
      progress: '0 % erledigt',
      log: 'Protokoll',
    },
    ki: {
      steps: [['Lesen', 'Die Mail wird gelesen.'], ['Erkennen', 'Anliegen, Lücken, Stimmung und Frist werden markiert.'], ['Entwerfen', 'Ein Entwurf entsteht, Ihr Team gibt ihn frei.']],
      legend: { anliegen: 'Anliegen', fehlt: 'Fehlt', stimmung: 'Stimmung', dringlichkeit: 'Dringlichkeit' },
      legendLabel: 'Legende der Markierungen',
      why: 'Warum markiert?',
      draftDoes: 'Was der Entwurf daraus macht',
      close: 'Schließen',
      tag: 'KI-Entwurf',
      system: 'Was das System tun würde',
      inbox: 'Posteingang (20 Beispiele)',
      counter: '{n} / {total}',
      next: 'Nächstes Beispiel →',
      random: 'Zufall',
      more: 'Weitere 19 Beispiele',
      mood: 'Stimmung',
      subject: 'Betreff',
      unread: 'ungelesen',
    },
    finder: {
      title: 'Paket-Assistent',
      demo: 'Demo, vorprogrammiert',
      note: 'Keine echte KI, es wird nichts gesendet.',
      hello: 'Hallo! Drei kurze Fragen, dann zeige ich Ihnen das passende Paket.',
      progress: 'Frage {n} von 3',
      typing: 'tippt…',
      ask: 'Anfragen',
      lines: {
        quick: 'Eine konkrete Aufgabe, Aufwand bis zu 4 Stunden.',
        check: 'Ein Tag Analyse, danach wissen Sie, wo es hakt.',
        launch: 'Zum Verkaufsstart ist alles startklar.',
        website: 'Ein One-Pager, fertig veröffentlicht.',
        ki: 'Antwortentwürfe, die Ihr Team nur noch prüft.',
      },
    },
    support: {
      label: 'Beispielrechnung',
      meter: 'Stunden im Monat',
      switch: 'im Monat',
      options: [5, 10, 20],
      total: '{h} h = {eur} €',
      promiseTitle: 'Meine Zusage',
      days: ['Tag 1', 'Tag 14', 'Tag 30'],
      stamp: '30 Tage Zusage',
    },
    process: {
      icons: ['Kalender', 'Angebot', 'Bausteine', 'Schlüssel'],
    },
    about: {
      line: 'Logik, Lösung, Live: so arbeite ich.',
      stories: [
        'Schule mit Deutsch-Schwerpunkt, danach IT-Studium in Tbilisi.',
        'Vertrieb für den DACH-Raum, später stellvertretende Teamleitung; danach Kundensupport auf Deutsch bei CMX Solutions.',
        'Trainings und Jugendbegegnungen: Teams, Workshops, Organisation.',
        'Studium Marketing & Sales an der FH CAMPUS 02, eigenes Gewerbe.',
      ],
      toolsLabel: 'Werkzeuge',
    },
    faq: {
      intro: 'Kurze Antworten auf das, was ich am häufigsten gefragt werde.',
      also: 'Auch gefragt:',
      missing: 'Frage nicht dabei? → Schreiben Sie mir',
      related: [[3, 6], [2, 6], [6, 1], [0, 4], [3, 5], [6, 0], [2, 0]],
    },
    contact: {
      builderLabel: 'Kurzes Briefing',
      sentence: 'Ich verkaufe {what} über {via}. Es hakt bei {issue}. Start: {start}.',
      // Stage 6b: «noch offen» as platform gets its own sentence; after «Hallo Iva,» the mail goes on in lower case.
      sentenceOpen: 'Ich verkaufe {what}. Die Plattform ist noch offen. Es hakt bei {issue}. Start: {start}.',
      viaOpen: 'noch offen',
      lower: true,
      fields: {
        what: ['Was', ['einen Onlinekurs', 'ein Coaching-Programm', 'eine Mitgliedschaft', 'einen Workshop', 'digitale Produkte']],
        via: ['Über', ['Leadpages', 'WordPress', 'Wix', 'Somba', 'Skool', 'eine eigene Website', 'noch offen']],
        issue: ['Es hakt bei', ['Zahlungen', 'Anmeldungen', 'E-Mails im Spam', 'Automationen', 'Ratenzahlungen', 'der Website']],
        start: ['Start', ['in 4 Wochen', 'in 2 Wochen', 'sofort', 'in 2 bis 3 Monaten', 'noch offen']],
      },
      preview: 'Vorschau Ihrer E-Mail',
      to: 'An',
      subjectLabel: 'Betreff',
      subject: 'Anfrage über mrlololi.com',
      greeting: 'Hallo Iva,',
      closing: 'Viele Grüße',
      open: 'E-Mail öffnen',
      note: 'Nichts wird über diese Seite gesendet oder gespeichert: Die E-Mail öffnet sich in Ihrem Mailprogramm.',
      bubble: 'Erzählen Sie mir, was hakt.',
      reply: 'Antwort innerhalb von 2 Werktagen',
      time: 'Ortszeit Graz: {time}',
      thanks: 'Danke! Sobald Ihre Mail da ist, melde ich mich innerhalb von zwei Werktagen.',
      fallback: 'Öffnet sich nichts? Schreiben Sie an {email}',
      copy: 'Kopieren',
      copied: 'Kopiert',
      photoAlt: 'Iva Tsatskrialashvili',
    },
    projects: {
      hub: { centre: 'Ihr Launch', parts: ['Checkout', 'E-Mail-Tool', 'Kursplattform', 'Zahlungsanbieter'] },
      site: { url: 'ihre-website.at', blocks: ['Header', 'Hero', 'Termin', 'Impressum'] },
      chat: { q: 'Hallo, wo finde ich meinen Login?', a: 'Liebe Mia, Ihren Zugang habe ich neu verschickt. Schauen Sie bitte auch im Spam-Ordner nach.', tag: 'KI-Entwurf' },
    },
    refs: { quotes: 'Kundenstimmen' },
    starter: {
      quick: { title: 'Checkout', broken: 'Link defekt', fixed: 'Alles läuft', pay: 'Bezahlen' },
      check: ['ActiveCampaign', 'Zapier/Make', 'Zahlung', 'Landingpages', 'Double-Opt-In'],
      recommended: 'Empfohlener Start',
    },
  },

  // Stage 6 (29.10.2026, «Klarer und kürzer»): one message per block. Copy for the new home blocks,
  // the video, the KI demo on its service page and the 404. Shortened from the texts above, nothing new.
  s6: {
    replay: 'Nochmal ansehen',
    // Stage 6b (29.10.2026): corrections after the review.
    b: {
      before: { signup: '45/47', spam: 'Spam', rate: 'Rate 2 fehlgeschlagen' },
      cta: 'Kostenloses Erstgespräch',
      ctaLine: 'Fragen zu Ihrem Ablauf? 20 Minuten, kostenlos.',
      chapterLabel: 'Video ab {time} abspielen: {name}',
      // One sentence per scene: what the picture shows (the video has no sound, WCAG 1.2.1).
      scenes: [
        'Bild: Ein Anmeldeformular für den Herbst-Kurs, Anna trägt Name und E-Mail ein und klickt auf «Jetzt anmelden».',
        'Bild: Viele Punkte fliegen vom Formular zu ActiveCampaign, an einer Sperre bleiben einige hängen, Logik schaut besorgt.',
        'Bild: Die Punkte stellen sich in eine Warteschlange, der Zähler steigt bis «300 von 300», Lösung hält den Schraubenschlüssel.',
        'Bild: SPF, DKIM und DMARC bekommen nacheinander einen Haken, die Mail wandert vom Spam in den Posteingang.',
        'Bild: «Rate 2 fehlgeschlagen», dann Erinnerung, Sperre und Freischaltung, das Schloss am Kurs geht wieder auf.',
        'Bild: Die Tür zum Kurs leuchtet, «Kurs offen», daneben ein Handy, Live freut sich.',
        'Bild: Das Logo mrlololi mit «Logik, Lösung, Live.» und den drei Figuren.',
      ],
      notDo: 'Was ich nicht mache: Werbetexte, Werbeanzeigen und laufenden Kundensupport. Dafür empfehle ich Ihnen gern Kolleg:innen.',
      ask: 'Anfragen',
      example: 'Beispiel ansehen',
      refs: {
        tools: ['ActiveCampaign', 'Zapier', 'Leadpages', 'Quaderno', 'Somba', 'Zoom'],
        video: 'Ablauf im Video ansehen',
        honest: 'Laufende Zusammenarbeit seit April 2026, Name nicht genannt.',
        earlierLine: 'Daher kenne ich Support-Teams von innen, die Grundlage für die KI-Antwortentwürfe.',
      },
      projects: { also: 'Außerdem:', and: 'und' },
      copyMail: 'Adresse kopieren',
      repaired: 'Repariert. Hier geht es weiter:',
    },
    fixDemo: { paid: 'Rate 2 bezahlt', inboxOk: 'angekommen' },
    video: {
      h2: 'Der Weg einer *Anmeldung*',
      text: 'Was zwischen Anmeldung und Kurszugang passiert, in 50 Sekunden und ohne Ton.',
      play: '50 Sekunden ansehen',
      label: 'Video: Der Weg einer Anmeldung, 50 Sekunden, ohne Ton, Text im Bild',
      chaptersLabel: 'Kapitel des Videos',
      chapters: [['Anmeldung', 0.1], ['Warteschlange', 4.1], ['Mail kommt an', 18.1], ['Rate', 26.1], ['Zugang', 34.1]],
      transcript: 'Text des Videos',
      // The seven lines of a.srt (video-konveyer), without timecodes.
      lines: [
        'Eine Anmeldung. Was jetzt passiert, entscheidet über Ihren Launch.',
        'Beim Launch kommen hunderte gleichzeitig. Ein Teil geht verloren.',
        'Warteschlange mit Wiederholung: 300 von 300.',
        'SPF, DKIM, DMARC: die Mail kommt an.',
        'Rate fehlgeschlagen? Erinnerung, Sperre, Freischaltung. Automatisch.',
        'Anna ist drin. Ohne Handarbeit.',
        'Gebaut, getestet, betreut. mrlololi.com',
      ],
      name: 'Der Weg einer Anmeldung',
      description: 'Was zwischen Anmeldung und Kurszugang passiert: Warteschlange mit Wiederholung, SPF, DKIM und DMARC, Erinnerung bei fehlgeschlagener Rate und Zugang ohne Handarbeit. 50 Sekunden, ohne Ton.',
    },
    pricing: {
      intro: 'Feste Preise, klarer Umfang. Ich arbeite mit wenigen Kund:innen gleichzeitig.',
      chooser: 'Welches Paket passt?',
      cards: {
        quick: { line: 'Eine konkrete Aufgabe, Aufwand bis zu 4 Stunden.', bullets: ['E-Mail-Zustellung (SPF, DKIM, DMARC)', 'Defekte Links oder Formulare', 'Termine oder eine Automation'] },
        check: { line: 'Ein Analysetag mit Lesezugriff auf die Tools oben, danach wissen Sie, wo es hakt.', bullets: ['Liste mit Prioritäten, Aufwand und Preisen', 'Gespräch von 45 Minuten', 'Bei einem Auftrag innerhalb von 30 Tagen voll angerechnet'] },
        launch: { line: 'Zum Verkaufsstart ist alles startklar. Festpreis nach dem Briefing.', bullets: ['Landingpages und Checkout', 'ActiveCampaign-Abläufe von der Anmeldung bis zum Zahlungsausfall', 'Formulare mit Double-Opt-In und Tags', 'Kurszugang in Somba, Skool oder Circle'] },
      },
      promise: '30-Tage-Zusage: Läuft ein von mir gebauter Ablauf in den ersten 30 Tagen nach Übergabe nicht wie vereinbart, behebe ich das ohne Berechnung. Zusätzlich zur gesetzlichen Gewährleistung.',
      more: 'Weitere Leistungen',
      rows: {
        website: 'Ein One-Pager, fertig veröffentlicht.',
        ki: 'Antwortentwürfe, die Ihr Team nur noch prüft. Pflege optional 90 € pro Monat.',
        support: 'Pflege und alles außerhalb der Pakete, ab 5 Stunden im Monat.',
      },
    },
    cta: { text: 'Nicht sicher, was passt? 20 Minuten, kostenlos. Ich sage ehrlich, ob ich helfen kann.', button: 'Kostenloses Erstgespräch' },
    refs: {
      labels: { course: 'Online-Kurse', site: 'Website', shop: 'E-Commerce', earlier: 'Frühere Tätigkeit' },
      earlier: 'Kundensupport auf Deutsch bei CMX Solutions',
      note: 'Zitate aus schriftlichen Referenzen, Original auf Anfrage.',
    },
    projects: {
      h2: 'Eigene *Projekte*',
      line: 'Selbst gebaut, keine Kundenarbeit.',
      shows: 'Was es zeigt:',
      all: 'Alle Webprojekte',
      // Shortened from the «Was es zeigt» lines on mrlololi.com/Webprojekte/.
      items: [
        { key: 'ki', name: 'KI im Kundenservice', path: 'ki-kundenservice/', shows: 'KI mit klaren Regeln: Ein Mensch gibt frei, nichts geht automatisch raus.' },
        { key: 'langstarter', name: 'Language Starter', path: 'language-starter/?ui=de', shows: '45 Sätze in 42 Sprachen, Sprachausgabe im Browser, ein Druckbild für ein A4-Blatt.' },
      ],
      // Stage 6b: the two off-topic ones as one text line.
      more: [
        { name: 'GeoAPP', path: 'geoapp/?lang=de' },
        { name: 'KittyCats', path: 'kittycats/' },
      ],
    },
    contact: { fallback: 'Öffnet sich nichts? Schreiben Sie an {email}', copy: 'Text kopieren', copied: 'Text kopiert', manual: 'Ihr Text zum Kopieren' },
    ki: {
      top: 'Links die Kundenmail, rechts der Entwurf. Ihr Team prüft und gibt frei.',
      steps: ['Lesen', 'Erkennen', 'Entwerfen'],
      stepsLabel: 'Schritte der Demo',
      mail: 'Kundenmail',
      draft: 'Entwurf',
      other: 'Anderes Beispiel',
      tone: 'Tonfall',
      approve: 'Freigeben',
      approved: 'Freigegeben',
      background: 'Was im Hintergrund passiert',
      all: 'Alle 20 Beispiele',
      calc: { hand: 'Von Hand', draft: 'Mit Entwurf', unit: 'h pro Monat', saving: 'Ersparnis: {h} h / {eur} € pro Monat' },
    },
    notFound: {
      h1: 'Hier ist die Leitung unterbrochen.',
      lead: 'Diese Seite gibt es nicht (mehr). Kein Problem, hier geht es weiter:',
      home: 'Startseite',
      projects: 'Projekte',
      contact: 'Kontakt',
      label: 'Weiter zu',
      nodes: ['Ihre Seite', 'Ziel'],
    },
  },

  // Identity 21.10.2026: mrlololi = Lo-Lo-Li. The first two letters of each word take the colour of its ball.
  brand: {
    tagline: 'Logik, Lösung, Live.',
    // Accessible name of a mascot button in the hero ({name}: Logik, Lösung, Live).
    mascotJump: '{name} springt',
  },

  // Stage 5 (28.10.2026): one page per service. The copy is reworded from the home page and
  // CONTENT.md, nothing new is promised; prices are read from pricing.groups by package id.
  services: {
    ui: {
      home: 'Startseite',
      services: 'Leistungen',
      crumbs: 'Sie sind hier',
      problem: 'Das Problem',
      does: 'Was ich mache',
      steps: 'So läuft es ab',
      example: 'Beispiel',
      faq: 'Häufige Fragen',
      related: 'Passt auch',
      more: 'Mehr zu',
      kiDemo: 'Zur KI-Demo auf der Startseite',
      kiDemoText: 'Auf der Startseite zeigt eine Demo, wie aus einer verärgerten Kundenmail ein fertiger Entwurf wird.',
      kiPortfolio: 'Ganze Demo im Portfolio',
      spamAlt: 'Eine Launch-Mail landet im Spam. Nach SPF, DKIM und DMARC kommt sie im Posteingang an.',
      notFound: 'Leistungen',
    },
    // Home page package card -> service page (the «Mehr zu …» link).
    byPackage: { quick: 'spam', check: 'activecampaign', launch: 'launch', website: 'website', ki: 'ki', support: 'activecampaign' },
    pages: [
      {
        key: 'launch',
        path: '/launch-technik/',
        short: 'Launch-Technik',
        moreLabel: 'Mehr zur Launch-Technik',
        h1: 'Launch-Technik für Online-Kurse',
        description: 'Launch-Technik für Online-Kurse: Landingpages, Checkout, ActiveCampaign, Double-Opt-In und Kurszugang, startklar zum Verkaufsstart. Ab 1.190 €.',
        promise: 'Ich verbinde Formulare, ActiveCampaign, Zapier, Checkout und Mitgliederbereich und teste alles, damit zum Verkaufsstart keine Anmeldung verloren geht.',
        packages: ['launch'],
        problem: ['Anmeldungen verschwinden zwischen Formular und CRM.', 'Die Ratenzahlung ist fehlgeschlagen, der Zugang bleibt trotzdem offen.', 'Jeder dieser Fehler kostet Anmeldungen, Umsatz oder Nerven.'],
        steps: [
          ['Erstgespräch, 20 Minuten, kostenlos.', 'Sie erzählen, was für Ihren Launch geplant ist. Ich sage ehrlich, ob ich helfen kann.'],
          ['Angebot.', 'Nach dem Briefing bekommen Sie einen Festpreis.'],
          ['Umsetzung.', 'Ich arbeite in Ihren Konten und teste mit Testkontakten, bevor echte Anmeldungen durchlaufen.'],
          ['Übergabe.', 'Eine schriftliche Anleitung, auf Wunsch ein kurzes Video, damit Ihr Team alles selbst pflegen kann.'],
        ],
        example: 'case2',
        faq: [
          ['Was kostet ein Launch-Setup?', 'Ab 1.190 €. Den Festpreis bekommen Sie nach dem Briefing.'],
          ['Brauche ich bestimmte Tools?', 'Nein. Ich arbeite mit dem, was Sie schon haben, und schlage einen Wechsel nur vor, wenn er sich rechnet.'],
          ['Wie schnell können Sie starten?', 'Projekte nach Absprache, weil ich bewusst nur wenige gleichzeitig annehme.'],
          ['Was, wenn ein Ablauf nach dem Start nicht läuft?', 'Zusätzlich zur gesetzlichen Gewährleistung: Läuft ein von mir gebauter Ablauf in den ersten 30 Tagen nicht wie vereinbart, behebe ich das ohne Berechnung. Das gilt für meine Arbeit, nicht für Ausfälle der Tools selbst.'],
          ['Wie gehen Sie mit Daten um?', 'Ich bekomme einen eigenen Benutzerzugang statt Ihres Passworts. Nach Projektende entfernen Sie meinen Zugang, und ich lösche die Kopien Ihrer Daten, die bei mir liegen.'],
        ],
        related: ['activecampaign', 'spam'],
      },
      {
        key: 'spam',
        path: '/e-mails-landen-im-spam/',
        short: 'E-Mails im Spam',
        h1: 'E-Mails landen im Spam? SPF, DKIM und DMARC einrichten',
        description: 'Launch-Mails landen im Spam? Ich richte SPF, DKIM und DMARC richtig ein und teste die Zustellung. Quick-Fix mit bis zu 4 Stunden Aufwand, 190 € fix.',
        promise: 'Ich richte SPF, DKIM und DMARC richtig ein und teste die Zustellung.',
        packages: ['quick'],
        problem: ['Launch-Mails landen im Spam.', 'Diesen Fehler sehe ich bei Launches immer wieder, und er kostet Anmeldungen, Umsatz oder Nerven.'],
        // Iva 29.10.2026, wörtlich.
        explain: { title: 'Kurz erklärt', text: 'SPF legt fest, welche Server im Namen Ihrer Domain senden dürfen. DKIM signiert jede Mail, damit der Empfänger sieht, dass sie unterwegs nicht verändert wurde. DMARC sagt dem Empfänger, was mit Mails passieren soll, die die Prüfung nicht bestehen, und schickt Ihnen Berichte. Seit 2024 verlangen Gmail und Yahoo von Absendern mit vielen Mails alle drei Einträge, seit 2025 auch Microsoft für Outlook und Hotmail.' },
        does: ['SPF, DKIM und DMARC richtig einrichten', 'Die Zustellung testen'],
        withSummary: true,
        steps: [
          ['Erstgespräch, 20 Minuten, kostenlos.', 'Sie erzählen, welche Mails im Spam landen. Ich sage ehrlich, ob ich helfen kann.'],
          ['Quick-Fix.', 'Kleine Dinge löse ich direkt, zum festen Preis.'],
          ['Umsetzung.', 'Ich setze die Einträge in Ihren Konten, dokumentiere jeden Schritt und teste die Zustellung.'],
          ['Übergabe.', 'Eine schriftliche Anleitung, damit Ihr Team weiß, was eingerichtet ist.'],
        ],
        example: 'spam',
        faq: [
          ['Wie schnell können Sie starten?', 'Quick-Fixes meist innerhalb einer Woche.'],
          ['Was, wenn 4 Stunden nicht reichen?', 'Alles außerhalb der Pakete: 45 € pro Stunde. Sie erfahren den Preis, bevor ich anfange.'],
          ['Bekommen Sie mein Passwort?', 'Nein. Ich bekomme einen eigenen Benutzerzugang statt Ihres Passworts. Nach Projektende entfernen Sie meinen Zugang, und ich lösche die Kopien Ihrer Daten, die bei mir liegen.'],
          ['Muss ich mich mit Technik auskennen?', 'Nein. Sie sagen mir, was passieren soll, ich kümmere mich um den Rest und erkläre alles in einfachen Worten.'],
        ],
        related: ['activecampaign', 'launch'],
      },
      {
        key: 'activecampaign',
        path: '/activecampaign-einrichten/',
        short: 'ActiveCampaign einrichten',
        h1: 'ActiveCampaign einrichten und betreuen',
        description: 'ActiveCampaign einrichten und betreuen: ein Tag Technik-Check für 290 €, danach Pflege Ihrer Automationen für 45 € pro Stunde. Aus Graz, remote.',
        promise: 'Ich prüfe Ihr ActiveCampaign-Konto, richte Abläufe ein und betreue sie danach, remote für Kund:innen in Österreich, Deutschland und der Schweiz.',
        packages: ['check', 'support'],
        problem: ['Anmeldungen verschwinden zwischen Formular und CRM.', 'Oft weiß niemand genau, wo das Problem liegt.', 'Jeder dieser Fehler kostet Anmeldungen, Umsatz oder Nerven.'],
        does: ['Ein Tag Analyse mit Lesezugriff: ActiveCampaign, Zapier oder Make, Zahlung, Landingpages, Double-Opt-In und Einwilligungen', 'Abläufe, die jede Anmeldung prüfen und bei Fehlern automatisch neu senden, auch wenn viele gleichzeitig kommen', 'Laufende Pflege Ihrer Automationen, kleine Landingpages, Fehlerbehebung'],
        steps: [
          ['Erstgespräch, 20 Minuten, kostenlos.', 'Sie erzählen, was in ActiveCampaign hakt. Ich sage ehrlich, ob ich helfen kann.'],
          ['Technik-Check oder Angebot.', 'Sie bekommen eine Liste mit Prioritäten, Aufwand und Preisen.'],
          ['Umsetzung.', 'Ich arbeite in Ihren Konten, dokumentiere jeden Schritt und teste mit Testkontakten.'],
          ['Betreuung.', 'Danach pflege ich Ihre Automationen nach Stunden, abgerechnet am Monatsende.'],
        ],
        example: 'case2',
        faq: [
          ['Was bekomme ich beim Technik-Check?', 'Sie bekommen eine Liste mit Prioritäten, Aufwand und Preisen und ein Gespräch von 45 Minuten. Beauftragen Sie innerhalb von 30 Tagen ein Projekt, rechne ich die 290 € voll an.'],
          ['Wie wird die Betreuung abgerechnet?', 'Mit 45 € pro Stunde, ab 5 Stunden im Monat. Abgerechnet wird am Monatsende nach Stunden.'],
          ['Arbeiten Sie auch remote?', 'Ja. Fast alle Projekte laufen remote im DACH-Raum. In Graz komme ich gern persönlich vorbei.'],
          ['Brauche ich bestimmte Tools?', 'Nein. Ich arbeite mit dem, was Sie schon haben, und schlage einen Wechsel nur vor, wenn er sich rechnet.'],
          ['Wie gehen Sie mit Daten um?', 'Ich bekomme einen eigenen Benutzerzugang statt Ihres Passworts. Nach Projektende entfernen Sie meinen Zugang, und ich lösche die Kopien Ihrer Daten, die bei mir liegen.'],
        ],
        related: ['launch', 'spam'],
      },
      {
        key: 'ki',
        path: '/ki-antwortentwuerfe/',
        short: 'KI-Antwortentwürfe',
        moreLabel: 'Mehr zu KI-Antwortentwürfen',
        h1: 'KI-Antwortentwürfe für Ihren Kundenservice',
        description: 'KI-Antwortentwürfe für Ihren Kundenservice: Wissensbasis aus Ihren FAQ, Entwürfe in GrooveHQ, Gmail oder Help Scout, Ihr Team gibt frei. Ab 590 €.',
        promise: 'Antwortentwürfe für wiederkehrende Fragen, die Ihr Team nur noch prüft und selbst versendet.',
        packages: ['ki'],
        problem: ['Ihr Postfach ist zu voll.', 'Viele Anfragen sind Standardfragen, und jede Antwort von Hand kostet Ihr Team Zeit.'],
        does: ['Wissensbasis aus Ihren FAQ und Kursregeln', 'Ablauf in Make oder Zapier', 'Antwortentwürfe mit Thema und Dringlichkeit in GrooveHQ, Gmail oder Help Scout', 'Test mit 50 Beispiel-E-Mails aus Ihrem Postfach, anonymisiert', 'Übergabe'],
        doesText: ['Es entstehen nur Entwürfe: Ihr Team prüft und versendet jede Antwort selbst.'],
        steps: [
          ['Erstgespräch, 20 Minuten, kostenlos.', 'Sie erzählen, welche Fragen immer wieder kommen. Ich sage ehrlich, ob ich helfen kann.'],
          ['Angebot.', 'Nach dem Briefing bekommen Sie einen Festpreis.'],
          ['Umsetzung.', 'Ich baue Wissensbasis und Ablauf und teste mit 50 anonymisierten Beispiel-E-Mails.'],
          ['Übergabe.', 'Eine schriftliche Anleitung, auf Wunsch ein kurzes Video, damit Ihr Team alles selbst pflegen kann.'],
        ],
        example: 'ki',
        faq: [
          ['Versendet die KI Antworten selbst?', 'Nein. Es entstehen nur Entwürfe: Ihr Team prüft und versendet jede Antwort selbst.'],
          ['Wie steht es um den Datenschutz?', 'Den Datenschutz klären wir vor dem Start, mit einem KI-Anbieter, der Daten in der EU verarbeitet, wo möglich.'],
          ['Was kostet die laufende Pflege?', 'Optional 90 € pro Monat, monatlich kündbar: bis 2 Stunden für Wissensbasis, Qualitätskontrolle und einen kurzen Bericht zur gesparten Zeit; darüber 45 € pro Stunde. API-Kosten zahlen Sie direkt.'],
          ['Übernehmen Sie auch den Kundensupport?', 'Nein. Ich baue die Technik, die Ihren Support entlastet, zum Beispiel Antwortentwürfe für wiederkehrende Fragen.'],
        ],
        related: ['activecampaign', 'launch'],
      },
      {
        key: 'website',
        path: '/website-one-pager/',
        short: 'Website als One-Pager',
        moreLabel: 'Mehr zur Website als One-Pager',
        h1: 'Website als One-Pager mit Leadpages oder Wix',
        description: 'Website als One-Pager mit Leadpages, Wix oder eigenem HTML: responsiv, mit Terminbuchung, Impressum, Datenschutz und Domain veröffentlicht. Ab 990 €.',
        promise: 'Ein One-Pager mit Leadpages, Wix oder eigenem HTML, fertig veröffentlicht.',
        packages: ['website'],
        problem: ['Sie brauchen eine Website.', 'Design, Terminbuchung, Rechtsseiten und Domain kosten Zeit und Nerven, bevor die Seite überhaupt online ist.'],
        does: ['Wix, Leadpages oder eigenes HTML, responsiv', 'Terminbuchung mit Calendly', 'Cookie-Banner und SEO-Grundlagen', 'Impressum und Datenschutz', 'Domain und Veröffentlichung', 'Übergabe-Gespräch und drei Korrekturschleifen'],
        steps: [
          ['Erstgespräch, 20 Minuten, kostenlos.', 'Sie erzählen, was Ihre Website zeigen soll. Ich sage ehrlich, ob ich helfen kann.'],
          ['Angebot.', 'Nach dem Briefing bekommen Sie einen Festpreis.'],
          ['Umsetzung.', 'Ich baue den One-Pager, Sie haben drei Korrekturschleifen.'],
          ['Übergabe.', 'Veröffentlichung auf Ihrer Domain und ein Übergabe-Gespräch.'],
        ],
        example: 'case1',
        faq: [
          ['Mit welchem Baukasten arbeiten Sie?', 'Mit Wix, Leadpages oder eigenem HTML. Ich arbeite mit dem, was Sie schon haben, und schlage einen Wechsel nur vor, wenn er sich rechnet.'],
          ['Sind Impressum und Datenschutz dabei?', 'Ja. Impressum und Datenschutz, Cookie-Banner und SEO-Grundlagen gehören zum Paket.'],
          ['Wie viele Korrekturen sind enthalten?', 'Drei Korrekturschleifen, dazu ein Übergabe-Gespräch.'],
          ['Muss ich mich mit Technik auskennen?', 'Nein. Sie sagen mir, was passieren soll, ich kümmere mich um den Rest und erkläre alles in einfachen Worten.'],
        ],
        related: ['launch', 'spam'],
      },
    ],
  },

  // Stage 5: Ratgeber template (DE only). Published only with config.ratgeber_live: true.
  ratgeber: {
    path: '/ratgeber/',
    title: 'Ratgeber | mrlololi',
    h1: 'Ratgeber',
    description: 'Artikel zu Launch-Technik, E-Mail-Zustellung und Automation für Online-Kursanbieter:innen, von Iva Tsatskrialashvili aus Graz.',
    intro: 'Artikel zu Launch-Technik, E-Mail-Zustellung und Automation für Online-Kursanbieter:innen.',
    by: 'von',
    published: 'Veröffentlicht am',
    modified: 'Aktualisiert am',
    readingTime: '{n} Min. Lesezeit',
    toc: 'Inhalt',
    cta: 'Passendes Paket',
    more: 'Weiterlesen',
    all: 'Alle Artikel',
    // Legal 29.10.2026: front matter «tax: true» and «affiliate: true».
    taxNote: 'Dieser Beitrag dient der allgemeinen Information und ersetzt keine Steuer- oder Rechtsberatung. Stand: {date}.',
    affiliate: 'Enthält Werbung / Affiliate-Links',
  },

  footer: {
    copyright: '© 2026 Iva Tsatskrialashvili · Werbeagentur · Graz, Österreich',
    legal: 'Impressum',
    privacy: 'Datenschutz',
  },

  notFound: {
    h1: 'Diese Seite gibt es nicht.',
    text: 'Vielleicht hilft die Startseite weiter.',
    link: 'Zur Startseite',
  },

  // Impressum (CONTENT.md section 3). Full address incl. flat number, confirmed by Iva (15.10.2026).
  // Legal 29.10.2026: UID, phone (second contact, § 5 ECG, only here) and the § 25 MedienG lines.
  legalPage: {
    h1: 'Impressum',
    address: ['Iva Tsatskrialashvili', 'Herbersteinstraße 4/4181', '8020 Graz, Österreich'],
    emailLabel: 'E-Mail',
    phoneLabel: 'Telefon',
    facts: [
      ['Unternehmensgegenstand', 'Werbeagentur (freies Gewerbe)'],
      ['GISA-Zahl', '40197975'],
      ['Gewerbebehörde', 'Magistrat der Stadt Graz'],
      ['Kammerzugehörigkeit', 'Wirtschaftskammer Steiermark'],
      ['Anwendbare Rechtsvorschriften', 'Gewerbeordnung, abrufbar unter www.ris.bka.gv.at'],
      ['UID-Nummer', '{uid}'],
      ['Umsatzsteuer', 'Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG'],
    ],
    disclosureTitle: 'Offenlegung gemäß § 25 Mediengesetz',
    disclosure: [
      ['Medieninhaber', 'Iva Tsatskrialashvili, Herbersteinstraße 4/4181, 8020 Graz, Österreich'],
      ['Unternehmensgegenstand', 'Werbeagentur (E-Mail-Marketing, Online-Kurs-Technik, Marketing-Automatisierung)'],
      ['Grundlegende Richtung', 'Information über die Dienstleistungen von mrlololi sowie fachliche Beiträge zu E-Mail-Marketing, Online-Kurs-Technik und Marketing-Automatisierung.'],
    ],
    linksTitle: 'Haftung für Links',
    links: 'Für Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.',
  },

  // Datenschutzerklärung (CONTENT.md section 4).
  privacyPage: {
    h1: 'Datenschutzerklärung',
    sections: [
      { key: 'controller', title: 'Verantwortlicher', text: 'Iva Tsatskrialashvili, Herbersteinstraße 4/4181, 8020 Graz, Österreich, {email}' },
      {
        key: 'hosting',
        title: 'Hosting',
        text: 'Diese Website wird bei GitHub Pages gehostet (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie Ihre IP-Adresse, Datum und Uhrzeit, die aufgerufene Seite und Browserinformationen, um die Seite auszuliefern und die Sicherheit zu gewährleisten. Rechtsgrundlage ist mein berechtigtes Interesse an einem sicheren und zuverlässigen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Dabei können Daten in die USA übermittelt werden.',
        dpf: 'GitHub ist unter dem EU-US Data Privacy Framework zertifiziert; die Übermittlung in die USA stützt sich darauf (Art. 45 DSGVO).',
      },
      { key: 'cookies', title: 'Keine Cookies, keine Analyse', text: 'Diese Website setzt keine Cookies und verwendet keine Analyse- oder Tracking-Werkzeuge. Schriften und Skripte werden vom eigenen Server geladen.' },
      { key: 'email', title: 'Kontakt per E-Mail', text: 'Wenn Sie mir schreiben, verarbeite ich Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO, bei allgemeinen Anfragen lit. f). E-Mails an hello@mrlololi.com werden über Cloudflare Email Routing (Cloudflare, Inc., USA) an mein Postfach bei Google (Gmail) weitergeleitet. Die Übermittlung in die USA stützt sich auf das EU-US Data Privacy Framework (Art. 45 DSGVO). Anfragen ohne Auftrag lösche ich nach spätestens 12 Monaten. Entsteht ein Auftrag, bewahre ich geschäftsrelevante Korrespondenz bis zum Ende der gesetzlichen Aufbewahrungsfrist auf (in der Regel 7 Jahre, § 132 BAO).' },
      { key: 'booking', title: 'Terminbuchung', text: 'Der Button „Termin buchen“ führt zu einem externen Anbieter. Dort gelten dessen Datenschutzbestimmungen. Daten werden erst übertragen, wenn Sie den Link anklicken.' },
      { key: 'links', title: 'Externe Links', text: 'Links zu LinkedIn, Malt oder Referenz-Websites führen zu fremden Seiten. Erst beim Anklicken werden Daten an diese Anbieter übertragen.' },
      // Datenschutz-Ergänzung 28.10.2026 (Iva, wörtlich; Ich-Form wie der Rest der Seite).
      { key: 'langstarter', title: 'Language Starter (Webprojekte)', text: 'Die Funktion „Anhören“ in Language Starter (mrlololi.com/Webprojekte/language-starter) nutzt die Sprachausgabe Ihres Browsers bzw. Geräts. Bei manchen Stimmen, zum Beispiel den „Google“-Stimmen in Google Chrome, wird der vorzulesende Satz zur Umwandlung in Sprache an den Sprachdienst des Browserherstellers übertragen. Ich selbst übermittle dabei keine Daten. Die App setzt keine Cookies, verwendet kein Tracking und speichert den Lernfortschritt nur lokal in Ihrem Browser (localStorage).' },
      { key: 'rights', title: 'Ihre Rechte', text: 'Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO). Schreiben Sie an {email}.' },
      { key: 'complaint', title: 'Beschwerde', text: 'Sie können sich bei der Österreichischen Datenschutzbehörde beschweren: Barichgasse 40-42, 1030 Wien, www.dsb.gv.at.' },
    ],
  },
};
