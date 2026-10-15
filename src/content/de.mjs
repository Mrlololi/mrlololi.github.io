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
    problem: 'Problem:',
    fix: 'Lösung:',
    lastUpdated: 'Stand',
    caseImageAlt: 'Startseite von alexandrafry.ch',
    translation: 'Übersetzung:',
    priceListLabel: 'Preisliste',
  },

  nav: [
    { label: 'Leistungen', href: '#services' },
    { label: 'Preise', href: '#pricing' },
    { label: 'Referenzen', href: '#references' },
    { label: 'Über mich', href: '#about' },
    { label: 'Kontakt', href: '#contact' },
  ],

  hero: {
    h1: 'Die Technik hinter Ihrem Kurs-Launch. Gebaut, getestet, betreut.',
    lead: 'Ich verbinde Formulare, ActiveCampaign, Zapier, Checkout und Mitgliederbereich so, dass beim Cart-Open nichts bricht und keine Anmeldung verloren geht.',
    primary: 'Erstgespräch anfragen',
    secondary: 'Preise ansehen',
    small: 'Aus Graz, remote im ganzen DACH-Raum. Deutsch, Englisch, Russisch und Georgisch.',
  },

  run: {
    title: 'Ablauf: Neue Kursanmeldung',
    steps: [
      { text: 'Anmeldung über das Leadpages-Formular', seconds: 0.2 },
      { text: 'Double-Opt-In bestätigt', seconds: 0.6 },
      { text: 'Kontakt in ActiveCampaign angelegt, Tag: Launch-Herbst', seconds: 0.9 },
      { text: 'Zahlung über Stripe erhalten, Rechnung in Quaderno erstellt', seconds: 1.4 },
      { text: 'Zugang zum Mitgliederbereich freigeschaltet', seconds: 1.9 },
      { text: 'Willkommens-Mail zugestellt, SPF, DKIM und DMARC in Ordnung', seconds: 2.3 },
    ],
    summary: '6 Schritte, 2,3 Sekunden, 0 Fehler',
    replay: 'Ablauf erneut starten',
  },

  problems: {
    h2: 'Wo es bei Launches meistens hakt',
    intro: 'Vier Fehler sehe ich immer wieder. Jeder kostet Anmeldungen, Umsatz oder Nerven.',
    items: [
      {
        severity: 'error',
        problem: 'Anmeldungen verschwinden zwischen Formular und CRM.',
        fix: 'Ich baue Strecken mit Prüfung und Wiederholung, die auch bei hunderten gleichzeitigen Anmeldungen sauber laufen.',
      },
      {
        severity: 'pending',
        problem: 'Launch-Mails landen im Spam.',
        fix: 'SPF, DKIM und DMARC richtig einrichten, die Absender-Domain aufwärmen und die Zustellung testen.',
      },
      {
        severity: 'error',
        problem: 'Die Ratenzahlung ist fehlgeschlagen, der Zugang bleibt trotzdem offen.',
        fix: 'Automatische Erinnerungen, Sperre und Freischaltung, abgestimmt mit Quaderno, Somba oder Stripe.',
      },
      {
        severity: 'pending',
        problem: 'Die Zapier-Rechnung wächst jeden Monat.',
        fix: 'Strecken mit vielen Durchläufen in Google Apps Script verlegen und die Fixkosten dauerhaft senken.',
      },
    ],
  },

  pricing: {
    h2: 'Leistungen und Preise',
    intro: 'Feste Preise, klarer Umfang. Ich arbeite mit wenigen Kund:innen gleichzeitig, an ein bis zwei Tagen pro Woche, und dafür mit voller Aufmerksamkeit.',
    groups: [
      {
        title: 'Einstieg',
        items: [
          {
            name: 'Quick-Fix',
            price: '290 € fix',
            summary: 'Eine konkrete Sache, bis 4 Stunden: Formular, Link, DNS-Eintrag, Automation oder Terminbuchung.',
          },
          {
            name: 'Technik-Check',
            price: '490 € fix',
            summary: 'Ein Tag Analyse Ihres Systems mit Lesezugriff: Datenverlust-Risiken, DSGVO, Zustellbarkeit und Checkout.',
            details: 'Sie bekommen einen schriftlichen Bericht mit Prioritäten und Preisen und eine Besprechung von 45 Minuten. Beauftragen Sie innerhalb von 30 Tagen ein Projekt, rechne ich die 490 € voll an.',
          },
        ],
      },
      {
        title: 'Projekte zum Festpreis',
        items: [
          {
            name: 'Launch-Setup',
            price: '1.800 bis 2.800 €',
            summary: 'Landingpages und Checkout, E-Mail-Automationen für Anmeldung, Erinnerung, Onboarding und Zahlungsausfall, Formulare mit sauberem Double-Opt-In, Kurszugänge im Mitgliederbereich und Bereitschaft am Cart-Open-Tag.',
            details: 'Optional: Launch-Standby in der Cart-Open-Woche mit Reaktion unter 2 Stunden, 450 €.',
          },
          {
            name: 'Website als One-Pager',
            price: '1.900 bis 2.500 €',
            summary: 'Leadpages, Wix oder WordPress, responsiv, mit Terminbuchung, Cookie-Hinweis, SEO-Grundlagen, Impressum und Datenschutz.',
            details: 'Drei Korrekturschleifen und ein Übergabe-Gespräch sind dabei.',
          },
          {
            name: 'KI im Kundenservice',
            price: 'Einrichtung ab 690 €, Betreuung ab 150 € pro Monat',
            summary: 'Jede eingehende Anfrage bekommt einen Antwortentwurf und eine Kategorie. Ihr Team prüft nur noch und sendet. Nichts geht ohne Freigabe hinaus.',
            calc: true,
          },
          {
            name: 'Zapier-Kosten senken',
            price: 'ab 1.200 €',
            summary: 'Teure Zapier-Strecken laufen danach in Ihrem eigenen Google Workspace. Das rechnet sich meist nach zwei bis vier Monaten.',
          },
        ],
      },
      {
        title: 'Laufende Betreuung',
        items: [
          {
            name: 'Tech-Retainer',
            price: 'pro Monat',
            tiers: [
              ['10 Stunden', '650 €'],
              ['20 Stunden', '1.200 €'],
              ['30 Stunden', '1.650 €'],
            ],
            summary: 'Laufende Automationen, Rechnungs- und Ratenzahlungsstrecken, kleine Landingpages, Fehlerbehebung und Bereitschaft im Launch.',
          },
        ],
      },
    ],
    hourly: 'Alles außerhalb der Pakete: 60 € pro Stunde. Express unter 48 Stunden oder am Wochenende: plus 50 %.',
    smallPrint: 'Alle Preise sind Endpreise. Als Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG weise ich keine Umsatzsteuer aus. Für Unternehmen in der EU mit UID gilt Reverse Charge.',
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

  process: {
    h2: 'So arbeiten wir',
    steps: [
      { title: 'Erstgespräch, 20 Minuten, kostenlos.', text: 'Sie erzählen, was hakt. Ich sage ehrlich, ob ich helfen kann.' },
      { title: 'Quick-Fix oder Angebot.', text: 'Kleine Dinge löse ich direkt, für größere bekommen Sie einen Festpreis.' },
      { title: 'Umsetzung.', text: 'Ich arbeite in Ihren Konten, dokumentiere jeden Schritt und teste mit echten Daten.' },
      { title: 'Übergabe.', text: 'Ein kurzes Video und eine schriftliche Anleitung, damit Ihr Team alles selbst pflegen kann.' },
    ],
  },

  refs: {
    h2: 'Referenzen',
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
    h2: 'Über mich',
    photoAlt: 'Iva Tsatskrialashvili',
    paragraphs: [
      'Ich bin Iva und lebe in Graz. Ich habe Informationstechnologie und Mobile Software Development studiert und studiere jetzt berufsbegleitend Marketing & Sales an der FH CAMPUS 02. Deshalb verstehe ich beides: den Funnel und die API dahinter.',
      'Seit 2023 arbeite ich für Onlineshops und Kursanbieter in Deutschland, der Schweiz, Italien und Österreich. Ich spreche Deutsch und Englisch auf C1-Niveau, Russisch und Georgisch als Muttersprachen und Spanisch auf B1.',
      'Mein Gewerbe ist in Österreich angemeldet. Sie bekommen ordentliche Rechnungen und einen festen Ansprechpartner.',
    ],
    tools: 'ActiveCampaign, Zapier, Make, Google Apps Script, Leadpages, WordPress, Wix, Shopware, Stripe, Quaderno, Somba, GrooveHQ, Canva, HTML, CSS, JavaScript, Python, SQL',
    geoapp: 'Eigenes Projekt: GeoAPP, eine Lern-App für georgische Zahlen',
  },

  faq: {
    h2: 'Häufige Fragen',
    items: [
      { q: 'Arbeiten Sie auch remote?', a: 'Ja. Fast alle Projekte laufen remote im DACH-Raum. In Graz komme ich gern persönlich vorbei.' },
      { q: 'Wie schnell können Sie starten?', a: 'Quick-Fixes meist innerhalb einer Woche. Projekte nach Absprache, weil ich bewusst nur wenige gleichzeitig annehme.' },
      { q: 'Brauche ich bestimmte Tools?', a: 'Nein. Ich arbeite mit dem, was Sie schon haben, und schlage einen Wechsel nur vor, wenn er sich rechnet.' },
      { q: 'Wie gehen Sie mit Daten um?', a: 'Ich arbeite mit eigenem Zugang in Ihren Konten, unterschreibe auf Wunsch einen Auftragsverarbeitungsvertrag und gebe alle Zugänge nach Projektende zurück.' },
      { q: 'Übernehmen Sie auch den Kundensupport?', a: 'Nein. Ich baue die Technik, die Ihren Support entlastet, zum Beispiel Antwortentwürfe für wiederkehrende Fragen.' },
      { q: 'Was, wenn mein Problem in kein Paket passt?', a: 'Schreiben Sie mir kurz, was nicht funktioniert. Sie erfahren den Preis, bevor ich anfange.' },
    ],
  },

  contact: {
    h2: 'Erzählen Sie mir, was hakt.',
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

  // Impressum (CONTENT.md section 3). Address without the flat number, per Iva (15.10.2026).
  legalPage: {
    h1: 'Impressum',
    address: ['Iva Tsatskrialashvili', 'Herbersteinstraße 4', '8020 Graz, Österreich'],
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
      ['Medieninhaber', 'Iva Tsatskrialashvili, Herbersteinstraße 4, 8020 Graz'],
      ['Grundlegende Richtung', 'Information über die Dienstleistungen von Iva Tsatskrialashvili im Bereich Marketing-Automation, Websites und Launch-Technik.'],
    ],
    linksTitle: 'Haftung für Links',
    links: 'Für Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.',
  },

  // Datenschutzerklärung (CONTENT.md section 4).
  privacyPage: {
    h1: 'Datenschutzerklärung',
    sections: [
      { key: 'controller', title: 'Verantwortlicher', text: 'Iva Tsatskrialashvili, Herbersteinstraße 4, 8020 Graz, Österreich, {email}' },
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
