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
    problem: 'Problem:',
    fix: 'Fix:',
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
  },

  run: {
    title: 'Run: new course sign-up',
    steps: [
      { text: 'Sign-up via the Leadpages form', seconds: 0.2 },
      { text: 'Double opt-in confirmed', seconds: 0.6 },
      { text: 'Contact created in ActiveCampaign, tag: launch-autumn', seconds: 0.9 },
      { text: 'Payment received via Stripe, invoice created in Quaderno', seconds: 1.4 },
      { text: 'Members area access granted', seconds: 1.9 },
      { text: 'Welcome email delivered, SPF, DKIM and DMARC passing', seconds: 2.3 },
    ],
    summary: '6 steps, 2.3 seconds, 0 errors',
    replay: 'Run it again',
  },

  problems: {
    h2: 'Where launches usually break',
    intro: 'I see the same four failures again and again. Each one costs sign-ups, revenue or nerves.',
    items: [
      {
        severity: 'error',
        problem: 'Sign-ups get lost between the form and the CRM.',
        fix: 'Flows with checks and retries that stay reliable even when hundreds of people sign up at once.',
      },
      {
        severity: 'pending',
        problem: 'Launch emails land in spam.',
        fix: 'Set up SPF, DKIM and DMARC correctly, warm up the sending domain and test delivery.',
      },
      {
        severity: 'error',
        problem: 'The instalment payment failed, but access is still open.',
        fix: 'Automatic reminders, suspension and reactivation, in sync with Quaderno, Somba or Stripe.',
      },
      {
        severity: 'pending',
        problem: 'The Zapier bill grows every month.',
        fix: 'Move high-volume flows to Google Apps Script and cut fixed costs for good.',
      },
    ],
  },

  pricing: {
    h2: 'Services and pricing',
    intro: 'Fixed prices, clear scope. I work with a few clients at a time, one to two days a week, and give each of them my full attention.',
    groups: [
      {
        title: 'Getting started',
        items: [
          {
            name: 'Quick fix',
            price: '€290 fixed',
            summary: 'One specific thing, up to 4 hours: a form, a link, a DNS record, an automation or a booking integration.',
          },
          {
            name: 'Tech check',
            price: '€490 fixed',
            summary: 'One day reviewing your setup with read access: data-loss risks, GDPR, deliverability and checkout.',
            details: 'You get a written report with priorities and prices and a 45-minute call. If you book a project within 30 days, the €490 is fully credited.',
          },
        ],
      },
      {
        title: 'Fixed-price projects',
        items: [
          {
            name: 'Launch setup',
            price: '€1,800 to €2,800',
            summary: 'Landing pages and checkout, email automations for sign-up, reminders, onboarding and failed payments, forms with proper double opt-in, course access in your members area, and support on cart-open day.',
            details: 'Optional: launch standby during cart-open week with response under 2 hours, €450.',
          },
          {
            name: 'One-page website',
            price: '€1,900 to €2,500',
            summary: 'Leadpages, Wix or WordPress, responsive, with booking, cookie notice, SEO basics, legal notice and privacy policy.',
            details: 'Three rounds of revisions and a handover call included.',
          },
          {
            name: 'AI in customer support',
            price: 'setup from €690, support from €150 per month',
            summary: 'Every incoming request gets a draft reply and a category. Your team only reviews and sends. Nothing goes out without approval.',
            calc: true,
          },
          {
            name: 'Lower your Zapier costs',
            price: 'from €1,200',
            summary: 'Expensive Zapier flows then run in your own Google Workspace. It usually pays for itself within two to four months.',
          },
        ],
      },
      {
        title: 'Ongoing support',
        items: [
          {
            name: 'Tech retainer',
            price: 'per month',
            tiers: [
              ['10 hours', '€650'],
              ['20 hours', '€1,200'],
              ['30 hours', '€1,650'],
            ],
            summary: 'Ongoing automations, invoicing and instalment flows, small landing pages, troubleshooting and launch support.',
          },
        ],
      },
    ],
    hourly: 'Anything outside the packages: €60 per hour. Express under 48 hours or on weekends: plus 50%.',
    smallPrint: 'All prices are final. As a small business under Austrian VAT law (§ 6 (1) Z 27 UStG) I do not charge VAT. For EU businesses with a VAT ID, the reverse charge applies.',
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
      { title: 'Handover.', text: 'A short video and written instructions so your team can maintain everything.' },
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
    geoapp: 'Side project: GeoAPP, a learning app for Georgian numbers',
  },

  faq: {
    h2: 'Frequently asked questions',
    items: [
      { q: 'Do you work remotely?', a: 'Yes. Almost all projects run remotely across Europe. In Graz I am happy to meet in person.' },
      { q: 'How soon can you start?', a: 'Quick fixes usually within a week. Projects by arrangement, because I take on only a few at a time.' },
      { q: 'Do I need specific tools?', a: 'No. I work with what you already have and only suggest a switch when it pays off.' },
      { q: 'How do you handle data?', a: 'I use my own login in your accounts, sign a data processing agreement on request and hand back all access when the project ends.' },
      { q: 'Do you also do customer support?', a: 'No. I build the tech that takes load off your support, for example draft replies for recurring questions.' },
      { q: "What if my problem doesn't fit a package?", a: "Send me a short note on what isn't working. You get the price before I start." },
    ],
  },

  contact: {
    h2: "Tell me what's not working.",
    text: 'I reply within two working days.',
    mail: 'Write an email',
    subject: 'Anfrage%20%C3%BCber%20mrlololi.com',
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
