// All English copy. Source: CONTENT.md (verbatim). To change a price or a sentence,
// edit it here AND in de.mjs, then run `npm run build`.

export default {
  lang: 'en',
  locale: 'en-GB',
  ogLocale: 'en_GB',
  paths: { home: '/en/', legal: '/en/legal-notice/', privacy: '/en/privacy/' },

  meta: {
    title: 'Iva Tsatskrialashvili - Marketing automation and launch tech from Graz, Austria',
    description: 'I build and maintain the tech behind online courses and digital products: ActiveCampaign, Zapier, landing pages and payments. Fixed prices, based in Graz, working remotely across Europe.',
  },
  legalMeta: {
    title: 'Legal notice - Iva Tsatskrialashvili',
    description: 'Legal notice (Impressum) and disclosure under the Austrian Media Act for Iva Tsatskrialashvili, advertising agency in Graz.',
  },
  privacyMeta: {
    title: 'Privacy policy - Iva Tsatskrialashvili',
    description: 'Privacy policy of the website of Iva Tsatskrialashvili: no cookies, no analytics, hosted on GitHub Pages.',
  },
  notFoundMeta: {
    title: 'Page not found - Iva Tsatskrialashvili',
    description: "This page doesn't exist.",
  },

  ui: {
    skip: 'Skip to content',
    menu: 'Menu',
    navLabel: 'Main navigation',
    footerNavLabel: 'Legal and language',
    wordmarkName: 'Iva Tsatskrialashvili, home',
    langShort: 'DE',
    langName: 'Deutsch',
    langCode: 'de',
    details: 'Details',
    problem: 'Problem',
    fix: 'Fix',
    lastUpdated: 'Last updated',
    caseImageAlt: 'Home page of alexandrafry.ch',
    translation: 'Translation:',
    priceListLabel: 'Price list',
  },

  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'References', href: '#references' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],

  hero: {
    h1: 'The tech behind your course launch. Built, tested, looked after.',
    lead: 'I connect forms, ActiveCampaign, Zapier, checkout and your members area so nothing breaks at cart open and no sign-up gets lost.',
    primary: 'Ask for a first call',
    secondary: 'See pricing',
    small: 'Based in Graz, working remotely across Europe. German, English, Russian and Georgian.',
    flow: {"label":"Flow: form, ActiveCampaign, payment, course open","nodes":["Form","ActiveCampaign","Payment","Course open"],"chip":"Hi, I'm Iva"},
  },

  run: {
    h2: "What happens when someone signs up",
    title: "Run: new course sign-up",
    steps: [
      { text: "Sign-up via the form", seconds: 0.2 },
      { text: "Email address confirmed", seconds: 0.6 },
      { text: "Contact created in ActiveCampaign", seconds: 0.9 },
      { text: "Payment received, invoice created", seconds: 1.4 },
      { text: "Course access granted", seconds: 1.9 },
      { text: "Welcome email arrived", seconds: 2.3 },
    ],
    summary: "6 steps, 2.3 seconds, 0 errors",
    replay: "Play again",
  },

  problems: {
    h2: "Where launches usually break",
    intro: "I see the same three failures again and again. Each one costs sign-ups, revenue or nerves.",
    items: [
      { problem: "Sign-ups get lost between the form and the CRM.", fix: "Flows with checks and retries that stay reliable even when many people sign up at once." },
      { problem: "Launch emails land in spam.", fix: "Set up SPF, DKIM and DMARC correctly and test delivery." },
      { problem: "The instalment payment failed, but access is still open.", fix: "Automatic reminders, suspension and reactivation, in sync with Quaderno, Somba or Stripe." },
    ],
  },

  pricing: {
    h2: 'Services and pricing',
    intro: 'Fixed prices, clear scope. I work with a few clients at a time, one to two days a week, and give each of them my full attention.',
    groups: [
      {
        "title": "Getting started",
        "items": [
          {
            "name": "Quick fix",
            "price": "€190 fixed",
            "summary": "One specific task in up to 4 hours: DNS, SPF and DMARC, broken links or forms, bookings or an automation."
          },
          {
            "name": "Tech check",
            "price": "€290 fixed",
            "summary": "One day of analysis with read access: ActiveCampaign, Zapier or Make, payments, landing pages, double opt-in and consents.",
            "details": "You get a list with priorities, effort and prices and a 45-minute call. If you book a project within 30 days, the €290 is fully credited."
          }
        ]
      },
      {
        "title": "Projects",
        "note": "Fixed price after the briefing.",
        "items": [
          {
            "name": "Launch setup",
            "price": "from €1,190",
            "summary": "Landing pages and checkout, ActiveCampaign flows for sign-up, reminders, launch, onboarding and failed payments, forms with double opt-in and tags, connections via Zapier or Apps Script to your CRM and members area, course setup in Somba, Skool or Circle, Zoom and calendar. Everything is ready when sales open."
          },
          {
            "name": "One-page website",
            "price": "from €990",
            "summary": "Wix, Leadpages or custom HTML, responsive, with Calendly, cookie banner, SEO basics, legal notice and privacy policy, domain, publishing, a handover call and three rounds of revisions."
          },
          {
            "name": "AI in customer support",
            "price": "from €590",
            "summary": "A knowledge base from your FAQ and course rules, a flow in Make or Zapier, draft replies with topic and urgency in GrooveHQ, Gmail or Help Scout, a test with 50 real emails, handover. Only drafts are created: nothing is sent until your team approves it (GDPR).",
            "extra": {
              "label": "Optional: care plan €90 per month",
              "text": "cancel monthly: up to 2 hours for the knowledge base, quality checks and a short report on time saved; beyond that €45 per hour; you pay API costs directly."
            },
            "calc": true
          }
        ]
      },
      {
        "title": "Ongoing support",
        "items": [
          {
            "name": "Support by the hour",
            "price": "€45 per hour",
            "summary": "From 5 hours a month: care for your automations, small landing pages, troubleshooting. Billed by the hour at the end of the month."
          }
        ]
      }
    ],
    hourly: "Anything outside the packages: €45 per hour.",
    smallPrint: 'All prices are final. As a small business under Austrian VAT law (§ 6 (1) Z 27 UStG) I do not charge VAT. For businesses with a valid VAT ID in another EU member state, the reverse charge applies.',
  },

  calc: {
    h3: 'How much time does your inbox cost you?',
    inputs: [
      { id: 'emails', label: 'Emails per week', value: 120, min: 0, max: 5000, step: 1 },
      { id: 'minutes', label: 'Minutes per reply', value: 6, min: 0, max: 120, step: 1 },
      { id: 'share', label: 'Share of standard questions in %', value: 60, min: 0, max: 100, step: 1 },
      { id: 'rate', label: "Your team's hourly rate in €", value: 25, min: 0, max: 300, step: 1 },
    ],
    sentence: 'Standard replies cost your team about {h} hours a month. With draft replies you save about {saved_h} hours, roughly €{saved_eur} a month.',
    note: 'Estimate. Assumption: a reviewed draft saves 70% of the time per standard reply.',
  },

  process: {
    h2: 'How we work',
    steps: [
      { title: 'First call, 20 minutes, free.', text: 'You tell me what is not working. I tell you honestly whether I can help.' },
      { title: 'Quick fix or quote.', text: 'Small things I fix right away, bigger ones get a fixed price.' },
      { title: 'Build.', text: 'I work in your accounts, document every step and test with real data.' },
      { title: 'Handover.', text: 'Written instructions, and a short video on request, so your team can maintain everything.' },
    ],
  },

  refs: {
    h2: 'References',
    case1: {
      domain: 'alexandrafry.ch',
      titleRest: ', website for an executive coach in Bern',
      text: 'One-pager built in Leadpages: responsive design, booking via Calendly, cookie notice, SEO basics, legal pages, domain and handover call.',
      quote: {
        lang: 'de',
        text: 'Sehr gerne bestätige ich, dass Iva Tsatskrialashvili diese Aufgabe hervorragend erfüllt und die Erwartungen übertroffen hat.',
        translation: 'I am happy to confirm that Iva Tsatskrialashvili completed this task excellently and exceeded expectations.',
        source: 'Alexandra Fry, Managing Director, FRY-CPC GmbH, Bern',
      },
    },
    case2: {
      title: 'Launch tech for an online course creator, since April 2026',
      text: 'ActiveCampaign and Zapier flows for sign-up, launch, onboarding and payment reminders, landing pages in Leadpages, invoices, instalments and course access with Quaderno and Somba, live sessions with Zoom and Ecamm.',
    },
    case3: {
      title: 'E-commerce for two German online shops, two and a half years',
      text: 'Relaunch of two online shops, product data and SEO content in CMS and PIM systems, market and competitor analysis, and shop statistics.',
      quote: {
        lang: 'de',
        text: 'Aus oben genannten Gründen halten wir Iva Tsatskrialashvili als Dienstleister für Projekte im Bereich Online Marketing und E-Commerce für sehr qualifiziert und möchten ihn ohne jegliche Vorbehalte an potenzielle Auftraggeber weiterempfehlen.',
        translation: 'For these reasons we consider Iva Tsatskrialashvili highly qualified as a service provider for online marketing and e-commerce projects and recommend him to potential clients without any reservations.',
        source: 'Ditoma GmbH, Ludwigsburg',
      },
    },
    quote4: {
      lang: 'en',
      text: 'He was also highly adaptable, quickly learning new tools and processes specific to each project.',
      source: 'Tamar Tsvimitidze, Operations Manager, CMX Solutions (customer support for Zalando and Medion)',
    },
  },

  about: {
    h2: 'About me',
    photoAlt: 'Iva Tsatskrialashvili',
    paragraphs: [
      "I'm Iva and I live in Graz, Austria. I studied information technology and mobile software development and now study marketing and sales part-time at FH CAMPUS 02. So I understand both: the funnel and the API behind it.",
      'Since 2023 I have worked for online shops and course creators in Germany, Switzerland, Italy and Austria. I speak German and English at C1 level, Russian and Georgian natively and Spanish at B1.',
      'My business is registered in Austria. You get proper invoices and one person who is responsible.',
    ],
    tools: 'ActiveCampaign, Zapier, Make, Google Apps Script, Leadpages, WordPress, Wix, Shopware, Stripe, Quaderno, Somba, GrooveHQ, Canva, HTML, CSS, JavaScript, Python, SQL',
    path: ['Tbilisi', 'DACH clients since 2020', 'Erasmus+ in 11 countries', 'Graz since 2025'],
    pathLabel: 'My path',
    projects: 'Side projects: GeoAPP and KittyCats',
  },

  faq: {
    h2: 'Frequently asked questions',
    items: [
      { q: 'Do I need to know about tech?', a: 'No. You tell me what should happen, I take care of the rest and explain everything in plain words.' },
      { q: 'Do you work remotely?', a: 'Yes. Almost all projects run remotely across Europe. In Graz I am happy to meet in person.' },
      { q: 'How soon can you start?', a: 'Quick fixes usually within a week. Projects by arrangement, because I take on only a few at a time.' },
      { q: 'Do I need specific tools?', a: 'No. I work with what you already have and only suggest a switch when it pays off.' },
      { q: 'How do you handle data?', a: 'I use my own login in your accounts and hand back all access when the project ends.' },
      { q: 'Do you also do customer support?', a: 'No. I build the tech that takes load off your support, for example draft replies for recurring questions.' },
      { q: "What if my problem doesn't fit a package?", a: "Send me a short note on what isn't working. You get the price before I start." },
    ],
  },

  contact: {
    h2: "Tell me what's not working.",
    text: 'I reply within two working days.',
    mail: 'Write an email',
    subject: 'Inquiry%20via%20mrlololi.com',
    booking: 'Book a call',
    linkedin: 'LinkedIn',
    malt: 'Malt profile',
  },

  footer: {
    copyright: '© 2026 Iva Tsatskrialashvili, Werbeagentur (advertising agency), Graz, Austria',
    legal: 'Legal notice',
    privacy: 'Privacy',
  },

  notFound: {
    h1: "This page doesn't exist.",
    text: 'The home page might help.',
    link: 'Go to the home page',
  },

  legalPage: {
    h1: 'Legal notice (Impressum)',
    address: ['Iva Tsatskrialashvili', 'Herbersteinstraße 4/4181', '8020 Graz, Austria'],
    emailLabel: 'Email',
    facts: [
      ['Business', 'advertising agency (free trade)'],
      ['Trade register number (GISA)', '40197975'],
      ['Trade authority', 'Magistrat der Stadt Graz'],
      ['Member of', 'Austrian Economic Chamber, Styria'],
      ['Applicable law', 'Austrian Trade Act (Gewerbeordnung), www.ris.bka.gv.at'],
      ['VAT ID', '{uid}'],
      ['VAT', 'small business exemption, § 6 (1) Z 27 UStG'],
    ],
    disclosureTitle: 'Disclosure under § 25 Austrian Media Act',
    disclosure: [
      ['Media owner', 'Iva Tsatskrialashvili, Herbersteinstraße 4/4181, 8020 Graz, Austria'],
      ['Basic editorial line', 'Information about the services of Iva Tsatskrialashvili in marketing automation, websites and launch tech.'],
    ],
    linksTitle: 'Liability for links',
    links: 'The operators of linked external websites are solely responsible for their content.',
  },

  privacyPage: {
    h1: 'Privacy policy',
    sections: [
      { key: 'controller', title: 'Controller', text: 'Iva Tsatskrialashvili, Herbersteinstraße 4/4181, 8020 Graz, Austria, {email}' },
      {
        key: 'hosting',
        title: 'Hosting',
        text: 'This website is hosted on GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). When you visit it, GitHub processes technically necessary data such as your IP address, date and time, the page requested and browser information in order to deliver the page and keep it secure. The legal basis is our legitimate interest in secure and reliable operation (Art. 6(1)(f) GDPR). Data may be transferred to the USA in the process.',
        dpf: 'GitHub is certified under the EU-US Data Privacy Framework.',
      },
      { key: 'cookies', title: 'No cookies, no analytics', text: "This website sets no cookies and uses no analytics or tracking tools. Fonts and scripts are loaded from the website's own server." },
      { key: 'email', title: 'Contact by email', text: 'If you write to me, I process your details in order to answer your enquiry (Art. 6(1)(b) GDPR, steps prior to entering into a contract). I delete the message when it is no longer needed, at the latest when statutory retention periods have expired.' },
      { key: 'booking', title: 'Booking a call', text: 'The “Book a call” button leads to an external provider. Its privacy policy applies there. Data is only transferred when you click the link.' },
      { key: 'links', title: 'External links', text: 'Links to LinkedIn, Malt or reference websites lead to third-party sites. Data is only transferred to these providers when you click them.' },
      { key: 'rights', title: 'Your rights', text: 'Access, rectification, erasure, restriction of processing, data portability and objection. Write to {email}.' },
      { key: 'complaint', title: 'Complaints', text: 'You can lodge a complaint with the Austrian Data Protection Authority: Barichgasse 40-42, 1030 Vienna, www.dsb.gv.at.' },
    ],
  },
};
