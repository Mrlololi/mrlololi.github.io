// All German copy. Source: CONTENT.md (verbatim). To change a price or a sentence,
// edit it here AND in en.mjs, then run `npm run build`.
// EMAIL, UID and URLs come from src/config.json.

export default {
  lang: 'de',
  locale: 'de-AT',
  ogLocale: 'de_AT',
  paths: { home: '/', legal: '/impressum/', privacy: '/datenschutz/' },

  meta: {
    title: 'Iva Tsatskrialashvili - Marketing-Automation und Launch-Technik aus Graz',
    description: 'Ich baue und betreue die Technik hinter Online-Kursen und digitalen Produkten: ActiveCampaign, Zapier, Landingpages und Zahlungen. Festpreise, aus Graz und remote im DACH-Raum.',
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
    pause: 'Animation anhalten',
    play: 'Animation fortsetzen',
    example: 'Beispiel',
  },

  nav: [
    { label: 'Leistungen', href: '#services' },
    { label: 'Preise', href: '#pricing' },
    { label: 'Referenzen', href: '#references' },
    { label: 'Über mich', href: '#about' },
    { label: 'Kontakt', href: '#contact' },
  ],

  hero: {
    h1: 'Die Technik hinter Ihrem Kurs-Launch. *Gebaut, getestet, betreut.*',
    lead: 'Ich verbinde Formulare, ActiveCampaign, Zapier, Checkout und Mitgliederbereich so, dass beim Cart-Open nichts bricht und keine Anmeldung verloren geht.',
    primary: 'Erstgespräch anfragen',
    secondary: 'Preise ansehen',
    small: 'Aus Graz, remote im ganzen DACH-Raum. Deutsch, Englisch, Russisch und Georgisch.',
    proof: 'Seit 2023 für Kursanbieter und Onlineshops in Deutschland, der Schweiz, Österreich und Italien · Gewerbe in Österreich',
    ribbon: 'Anmeldung eingegangen · E-Mail bestätigt · Tag gesetzt · Zahlung erhalten · Zugang frei · Willkommens-Mail angekommen ·',
    flow: {"label":"Ablauf: Formular, ActiveCampaign, Zahlung, Kurs offen","nodes":["Formular","ActiveCampaign","Zahlung","Kurs offen"],"chip":"Hallo, ich bin Iva"},
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
      "button": "Jetzt anmelden"
    },
    "runLabel": "Beispiel-Durchlauf",
    "welcome": {
      "subject": "Willkommen im Kurs, Anna!",
      "text": "Ihr Zugang ist bereit. Viel Freude beim Lernen.",
      "access": "Kurszugang: freigeschaltet"
    },
    "toasts": [
      "Neue Anmeldung: Anna K.",
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
    summary: "6 Schritte, 2,3 Sekunden, 0 Fehler",
    replay: "Nochmal abspielen",
  },

  problems: {
    h2: "Wo es bei Launches *meistens hakt*",
    intro: "Drei Fehler sehe ich immer wieder. Jeder kostet Anmeldungen, Umsatz oder Nerven.",
    slider: {
      label: 'Vorher / Nachher ziehen',
      before: 'Chaos',
      after: 'Geordnet',
      alt: 'Vorher: Formular, ActiveCampaign, Zapier, Stripe und Kurs kreuz und quer verbunden, drei Verbindungen gerissen. Nachher: dieselben Werkzeuge in einem klaren Ablauf.',
      nodes: ['Formular', 'ActiveCampaign', 'Zapier', 'Stripe', 'Kurs'],
    },
    items: [
      { problem: "Anmeldungen verschwinden zwischen Formular und CRM.", fix: "Ich baue Strecken mit Prüfung und Wiederholung, die auch bei vielen gleichzeitigen Anmeldungen sauber laufen." },
      { problem: "Launch-Mails landen im Spam.", fix: "SPF, DKIM und DMARC richtig einrichten und die Zustellung testen." },
      { problem: "Die Ratenzahlung ist fehlgeschlagen, der Zugang bleibt trotzdem offen.", fix: "Automatische Erinnerungen, Sperre und Freischaltung, abgestimmt mit Quaderno, Somba oder Stripe." },
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
            "summary": "Eine konkrete Aufgabe in bis zu 4 Stunden: DNS, SPF und DMARC, defekte Links oder Formulare, Termine oder eine Automation."
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
            "summary": "Landingpages und Checkout, ActiveCampaign-Abläufe für Anmeldung, Erinnerung, Start, Onboarding und Zahlungsausfall, Formulare mit Double-Opt-In und Tags, Verbindungen über Zapier oder Apps Script zu CRM und Mitgliederbereich, Kurs-Einrichtung in Somba, Skool oder Circle, Zoom und Kalender. Zum Verkaufsstart ist alles startklar."
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
            "summary": "Wissensbasis aus Ihren FAQ und Kursregeln, Ablauf in Make oder Zapier, Antwortentwürfe mit Thema und Dringlichkeit in GrooveHQ, Gmail oder Help Scout, Test mit 50 echten E-Mails, Übergabe. Es entstehen nur Entwürfe: versendet wird erst nach Freigabe durch Ihr Team (DSGVO).",
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
    hourly: "Alles außerhalb der Pakete: 45 € pro Stunde.",
    promise: "Meine Zusage: Läuft eine von mir gebaute Strecke in den ersten 30 Tagen nicht wie vereinbart, behebe ich das ohne Berechnung. Das gilt für meine Arbeit, nicht für Ausfälle der Tools selbst.",
    smallPrint: 'Alle Preise sind Endpreise. Als Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG weise ich keine Umsatzsteuer aus. Bei Unternehmen mit gültiger UID in einem anderen EU-Mitgliedstaat geht die Steuerschuld auf den Leistungsempfänger über (Reverse Charge).',
  },

  ki: {
    "h3": "Vom verärgerten Mail zum fertigen *Entwurf*",
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
    "replay": "Nochmal",
    "caption": "Die Entwürfe klingen wie Ihre Schule.",
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
    h2: 'So arbeiten *wir*',
    steps: [
      { title: 'Erstgespräch, 20 Minuten, kostenlos.', text: 'Sie erzählen, was hakt. Ich sage ehrlich, ob ich helfen kann.' },
      { title: 'Quick-Fix oder Angebot.', text: 'Kleine Dinge löse ich direkt, für größere bekommen Sie einen Festpreis.' },
      { title: 'Umsetzung.', text: 'Ich arbeite in Ihren Konten, dokumentiere jeden Schritt und teste mit echten Daten.' },
      { title: 'Übergabe.', text: 'Eine schriftliche Anleitung, auf Wunsch ein kurzes Video, damit Ihr Team alles selbst pflegen kann.' },
    ],
  },

  refs: {
    study: {"title":"Fallbeispiel: Online-Kursanbieterin","before":"Vorher","after":"Nachher"},
    h2: '*Referenzen*',
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
      text: 'ActiveCampaign- und Zapier-Strecken für Anmeldung, Launch, Onboarding und Zahlungserinnerungen, Landingpages in Leadpages, Rechnungen, Ratenzahlungen und Kurszugänge mit Quaderno und Somba, Live-Termine mit Zoom und Ecamm.',
    },
    case3: {
      title: 'E-Commerce für zwei deutsche Onlineshops, zweieinhalb Jahre',
      text: 'Relaunch zweier Onlineshops, Produktdaten und SEO-Inhalte in CMS- und PIM-Systemen, Markt- und Wettbewerbsanalysen und Auswertungen der Shop-Statistiken.',
      quote: {
        lang: 'de',
        text: 'Aus oben genannten Gründen halten wir Iva Tsatskrialashvili als Dienstleister für Projekte im Bereich Online Marketing und E-Commerce für sehr qualifiziert und möchten ihn ohne jegliche Vorbehalte an potenzielle Auftraggeber weiterempfehlen.',
        source: 'Ditoma GmbH, Ludwigsburg',
      },
    },
    quote4: {
      lang: 'en',
      text: 'He was also highly adaptable, quickly learning new tools and processes specific to each project.',
      source: 'Tamar Tsvimitidze, Operations Manager, CMX Solutions (Kundensupport für Zalando und Medion)',
    },
  },

  about: {
    h2: 'Über *mich*',
    photoAlt: 'Iva Tsatskrialashvili',
    paragraphs: [
      'Ich bin Iva und lebe in Graz. Ich habe Informationstechnologie und Mobile Software Development studiert und studiere jetzt berufsbegleitend Marketing & Sales an der FH CAMPUS 02. Deshalb verstehe ich beides: den Funnel und die API dahinter.',
      'Seit 2023 arbeite ich für Onlineshops und Kursanbieter in Deutschland, der Schweiz, Italien und Österreich. Ich spreche Deutsch und Englisch auf C1-Niveau, Russisch und Georgisch als Muttersprachen und Spanisch auf B1.',
      'Mein Gewerbe ist in Österreich angemeldet. Sie bekommen ordentliche Rechnungen und einen festen Ansprechpartner.',
    ],
    tools: 'ActiveCampaign, Zapier, Make, Google Apps Script, Leadpages, WordPress, Wix, Shopware, Stripe, Quaderno, Somba, GrooveHQ, Canva, HTML, CSS, JavaScript, Python, SQL',
    path: ['Tbilisi', 'DACH-Vertrieb ab 2020', 'Erasmus+ in 11 Ländern', 'Graz seit 2025'],
    pathLabel: 'Mein Weg',
    projects: 'Eigene Projekte: GeoAPP und KittyCats',
  },

  notdo: {"label":"Was ich nicht mache:","text":"Werbetexte schreiben, Ads schalten oder Ihren Kundensupport übernehmen. Dafür empfehle ich Ihnen gern Kolleg:innen."},

  faq: {
    typing: "tippt…",
    h2: 'Häufige *Fragen*',
    items: [
      { q: 'Muss ich mich mit Technik auskennen?', a: 'Nein. Sie sagen mir, was passieren soll, ich kümmere mich um den Rest und erkläre alles in einfachen Worten.' },
      { q: 'Arbeiten Sie auch remote?', a: 'Ja. Fast alle Projekte laufen remote im DACH-Raum. In Graz komme ich gern persönlich vorbei.' },
      { q: 'Wie schnell können Sie starten?', a: 'Quick-Fixes meist innerhalb einer Woche. Projekte nach Absprache, weil ich bewusst nur wenige gleichzeitig annehme.' },
      { q: 'Brauche ich bestimmte Tools?', a: 'Nein. Ich arbeite mit dem, was Sie schon haben, und schlage einen Wechsel nur vor, wenn er sich rechnet.' },
      { q: 'Wie gehen Sie mit Daten um?', a: 'Ich arbeite mit eigenem Zugang in Ihren Konten und gebe nach Projektende alle Zugänge zurück.' },
      { q: 'Übernehmen Sie auch den Kundensupport?', a: 'Nein. Ich baue die Technik, die Ihren Support entlastet, zum Beispiel Antwortentwürfe für wiederkehrende Fragen.' },
      { q: 'Was, wenn mein Problem in kein Paket passt?', a: 'Schreiben Sie mir kurz, was nicht funktioniert. Sie erfahren den Preis, bevor ich anfange.' },
    ],
  },

  contact: {
    h2: 'Erzählen Sie mir, *was hakt.*',
    text: 'Ich antworte innerhalb von zwei Werktagen.',
    mail: 'E-Mail schreiben',
    subject: 'Anfrage%20%C3%BCber%20mrlololi.com',
    booking: 'Termin buchen',
    linkedin: 'LinkedIn',
    malt: 'Malt-Profil',
  },

  footer: {
    copyright: '© 2026 Iva Tsatskrialashvili, Werbeagentur, Graz',
    legal: 'Impressum',
    privacy: 'Datenschutz',
  },

  notFound: {
    h1: 'Diese Seite gibt es nicht.',
    text: 'Vielleicht hilft die Startseite weiter.',
    link: 'Zur Startseite',
  },

  // Impressum (CONTENT.md section 3). Full address incl. flat number, confirmed by Iva (15.10.2026).
  legalPage: {
    h1: 'Impressum',
    address: ['Iva Tsatskrialashvili', 'Herbersteinstraße 4/4181', '8020 Graz, Österreich'],
    emailLabel: 'E-Mail',
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
      ['Medieninhaber', 'Iva Tsatskrialashvili, Herbersteinstraße 4/4181, 8020 Graz'],
      ['Grundlegende Richtung', 'Information über die Dienstleistungen von Iva Tsatskrialashvili im Bereich Marketing-Automation, Websites und Launch-Technik.'],
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
        text: 'Diese Website wird bei GitHub Pages gehostet (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie Ihre IP-Adresse, Datum und Uhrzeit, die aufgerufene Seite und Browserinformationen, um die Seite auszuliefern und die Sicherheit zu gewährleisten. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und zuverlässigen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Dabei können Daten in die USA übermittelt werden.',
        dpf: 'GitHub ist unter dem EU-US Data Privacy Framework zertifiziert.',
      },
      { key: 'cookies', title: 'Keine Cookies, keine Analyse', text: 'Diese Website setzt keine Cookies und verwendet keine Analyse- oder Tracking-Werkzeuge. Schriften und Skripte werden vom eigenen Server geladen.' },
      { key: 'email', title: 'Kontakt per E-Mail', text: 'Wenn Sie mir schreiben, verarbeite ich Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO, Anbahnung eines Vertrags). Ich lösche die Nachricht, wenn sie nicht mehr gebraucht wird, spätestens nach Ablauf gesetzlicher Aufbewahrungsfristen.' },
      { key: 'booking', title: 'Terminbuchung', text: 'Der Button „Termin buchen“ führt zu einem externen Anbieter. Dort gelten dessen Datenschutzbestimmungen. Daten werden erst übertragen, wenn Sie den Link anklicken.' },
      { key: 'links', title: 'Externe Links', text: 'Links zu LinkedIn, Malt oder Referenz-Websites führen zu fremden Seiten. Erst beim Anklicken werden Daten an diese Anbieter übertragen.' },
      { key: 'rights', title: 'Ihre Rechte', text: 'Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Schreiben Sie an {email}.' },
      { key: 'complaint', title: 'Beschwerde', text: 'Sie können sich bei der Österreichischen Datenschutzbehörde beschweren: Barichgasse 40-42, 1030 Wien, www.dsb.gv.at.' },
    ],
  },
};
