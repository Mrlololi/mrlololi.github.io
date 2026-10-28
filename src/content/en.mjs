// All English copy. Source: CONTENT.md (verbatim). To change a price or a sentence,
// edit it here AND in de.mjs, then run `npm run build`.

export default {
  lang: 'en',
  locale: 'en-GB',
  ogLocale: 'en_GB',
  paths: { home: '/en/', legal: '/en/legal-notice/', privacy: '/en/privacy/' },

  meta: {
    title: 'Marketing automation & launch tech from Graz | mrlololi',
    description: 'I build and maintain the tech behind online courses: ActiveCampaign, Zapier, landing pages, payments. Marketing automation and launch tech from Graz.',
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
    newTab: '(opens in a new tab)',
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
    matching: "Matching package:",
    pause: 'Pause animation',
    play: 'Play animation',
    example: 'Example',
  },

  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'References', href: '#references' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],

  hero: {
    h1: 'The tech behind your course launch. *Built, tested, maintained.*',
    lead: 'I connect forms, ActiveCampaign, Zapier, checkout and your members area so nothing breaks when sales open and no sign-up gets lost.',
    primary: 'Request a free intro call',
    secondary: 'See pricing',
    small: 'Based in Graz, working remotely across Europe. German, English, Russian and Georgian.',
    proof: 'Since 2023 for online shops, since 2026 for online course creators in Germany, Switzerland, Austria and Italy · Business registered in Austria',
    ribbon: 'Sign-up received · Email confirmed · Tag added · Payment received · Access granted · Welcome email arrived ·',
    flow: {"label":"Flow: form, ActiveCampaign, payment, course open","nodes":["Form","ActiveCampaign","Payment","Course open"],"lines":["The sign-up comes in and is checked.","Contact, tag and welcome email are set.","Payment or instalment is recognised, the invoice goes out.","Access is granted, with no manual work."],"chip":"Hi, I'm Iva"},
  },

  tools: {
    label: 'I work with',
    items: ["ActiveCampaign","Zapier","Make","Leadpages","Stripe","Quaderno","Somba","WordPress","Wix","Google Apps Script"],
  },

  story: {
    "label": "The flow in three steps",
    "steps": [
      "A sign-up comes in",
      "The automation runs",
      "Your student is in"
    ],
    "form": {
      "title": "Sign up for the autumn course",
      "fields": [
        [
          "Name",
          "Anna K."
        ],
        [
          "Email",
          "anna@example.com"
        ]
      ],
      "note": "Preview only: nothing is sent or stored.",
      "error": "Please enter a valid email address.",
      "button": "Sign up now"
    },
    "runLabel": "Example run",
    "welcome": {
      "subject": "Welcome to the course, {first}!",
      "text": "Your access is ready. Enjoy learning.",
      "access": "Course access: granted"
    },
    "toasts": [
      "New sign-up: {name}",
      "Payment received: €297",
      "Course access granted",
      "Welcome email delivered"
    ]
  },

  run: {
    h2: "What happens when someone *signs up*",
    title: "Run: new course sign-up",
    steps: [
      { text: "Sign-up via the form", seconds: 0.2 },
      { text: "Email address confirmed", seconds: 0.6 },
      { text: "Contact created in ActiveCampaign", seconds: 0.9 },
      { text: "Payment received, invoice created", seconds: 1.4 },
      { text: "Course access granted", seconds: 1.9 },
      { text: "Welcome email arrived", seconds: 2.3 },
    ],
    summary: "6 steps, 2.3 seconds, 0 errors (simplified example)",
    replay: "Play again",
  },

  problems: {
    h2: "Where launches *usually break*",
    intro: "I see the same three failures again and again. Each one costs sign-ups, revenue or nerves.",
    slider: {
      label: 'Drag before / after',
      before: 'Chaos',
      after: 'Sorted',
      valuetext: 'Before {v} %',
      alt: 'Before: form, ActiveCampaign, Zapier, Stripe and course wired every which way, three links broken. After: the same tools in one clear flow.',
      nodes: ['Form', 'ActiveCampaign', 'Zapier', 'Stripe', 'Course'],
    },
    items: [
      { problem: "Sign-ups get lost between the form and the CRM.", fix: "I build flows that check every sign-up and resend it automatically on errors, even when many come in at once.", pkg: "check" },
      { problem: "Launch emails land in spam.", fix: "Set up SPF, DKIM and DMARC correctly and test delivery.", pkg: "quick" },
      { problem: "The instalment payment failed, but access is still open.", fix: "Automatic reminders, suspension and reactivation, in sync with Quaderno, Somba or Stripe.", pkg: "launch" },
    ],
  },

  pricing: {
    h2: 'Services and *pricing*',
    intro: 'Fixed prices, clear scope. I work with a few clients at a time, one to two days a week, and give each of them my full attention.',
    groups: [
      {
        "title": "Getting started",
        "items": [
          {
            "id": "quick",
            "name": "Quick fix",
            "price": "€190 fixed",
            "summary": "One specific task in up to 4 hours: DNS and email records (SPF, DKIM, DMARC), broken links or forms, bookings or an automation."
          },
          {
            "id": "check",
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
            "id": "launch",
            "name": "Launch setup",
            "price": "from €1,190",
            "bullets": ["Landing pages and checkout", "ActiveCampaign flows for sign-up, reminders, launch, onboarding and failed payments", "Forms with double opt-in and tags", "Connections via Zapier or Apps Script to your CRM and members area", "Course setup in Somba, Skool or Circle, Zoom and calendar"],
            "summary": "Everything is ready when sales open."
          },
          {
            "id": "website",
            "name": "One-page website",
            "price": "from €990",
            "summary": "Wix, Leadpages or custom HTML, responsive, with Calendly, cookie banner, SEO basics, legal notice and privacy policy, domain, publishing, a handover call and three rounds of revisions."
          },
          {
            "id": "ki",
            "name": "AI in customer support",
            "price": "from €590",
            "summary": "A knowledge base from your FAQ and course rules, a flow in Make or Zapier, draft replies with topic and urgency in GrooveHQ, Gmail or Help Scout, a test with 50 sample emails from your inbox, anonymised, handover. Only drafts are created: your team reviews and sends every reply itself. We settle data protection before the start, with an AI provider that processes data in the EU where possible.",
            "extra": {
              "label": "Optional: care plan €90 per month",
              "text": "cancellable monthly: up to 2 hours for the knowledge base, quality checks and a short report on time saved; beyond that €45 per hour; you pay API costs directly."
            },
            "calc": true
          }
        ]
      },
      {
        "title": "Ongoing support",
        "items": [
          {
            "id": "support",
            "name": "Support by the hour",
            "price": "€45 per hour",
            "summary": "From 5 hours a month: care for your automations, small landing pages, troubleshooting. Billed by the hour at the end of the month."
          }
        ]
      }
    ],
    cta: "Enquire",
    subjectPrefix: "Enquiry: ",
    hourly: "Anything outside the packages: €45 per hour.",
    promise: "On top of statutory warranty rights: if a flow I built does not work as agreed within the first 30 days, I fix it free of charge. This covers my work, not outages of the tools themselves.",
    smallPrint: 'All prices are final. As a small business under Austrian VAT law (§ 6 (1) Z 27 UStG) I do not charge VAT. For businesses with a valid VAT ID in another EU member state, the reverse charge applies.',
  },

  ki: {
    "h3": "From an upset customer email to a ready *draft*",
    "from": "Anna K.",
    "mail": "hi i bought the course but never got a login??? and the invoice is missing too. really annoying, need this by tomorrow!!",
    "marks": [
      "never got a login",
      "the invoice is missing",
      "really annoying",
      "by tomorrow"
    ],
    "chips": [
      "Topic: login",
      "Invoice missing",
      "Mood: upset",
      "urgent"
    ],
    "pill": "Drafting reply…",
    "toneLabel": "Tone",
    "tones": [
      [
        "Formal",
        "Dear Anna, thank you for your message and sorry for the trouble. I have resent your access, and you will find the invoice attached. I am happy to help with any questions."
      ],
      [
        "Friendly",
        "Hi Anna, thanks for your message and sorry for the hassle. I've resent your access and the invoice is attached. Just get in touch if you have questions."
      ],
      [
        "Casual",
        "Hey Anna! Sorry about the mix-up. Your access is on its way again, invoice attached. Just shout if anything's missing."
      ]
    ],
    "buttons": [
      "Approve",
      "Edit"
    ],
    "note": "Nothing is sent until your team approves it.",
    "approved": "Approved",
    "sent": "Reply to Anna sent (example)",
    "done": "Done",
    "editLabel": "Edit reply",
    "replay": "Play again",
    "caption": "The drafts sound like you.",
    "speed": {
      "label": "Example values",
      "slow": "By hand: about 6 minutes per reply",
      "fast": "With a draft: about 1 minute to review"
    }
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

  finder: {
    "h2": "Which package *fits?*",
    "questions": [
      [
        "What is it about?",
        [
          [
            "broken",
            "Something isn't working"
          ],
          [
            "launch",
            "I'm planning a launch"
          ],
          [
            "website",
            "I need a website"
          ],
          [
            "inbox",
            "My inbox is too full"
          ]
        ]
      ],
      [
        "Do you know where the problem is?",
        [
          [
            "yes",
            "Yes, pretty much"
          ],
          [
            "no",
            "No, not really"
          ]
        ]
      ],
      [
        "When?",
        [
          [
            "soon",
            "In the next 2 weeks"
          ],
          [
            "later",
            "Later"
          ]
        ]
      ]
    ],
    "result": "Best fit: {pkg}",
    "link": "See the package",
    "restart": "Start again",
    "closing": {
      "soon": "Write to me right away.",
      "later": "Happy to plan a later date too."
    },
    "static": [
      [
        "Something isn't working and you know where",
        "quick"
      ],
      [
        "You don't know where the problem is",
        "check"
      ],
      [
        "You're planning a launch",
        "launch"
      ],
      [
        "You need a website",
        "website"
      ],
      [
        "Your inbox is too full",
        "ki"
      ]
    ]
  },

  process: {
    h2: 'How we work *together*',
    steps: [
      { title: 'First call, 20 minutes, free.', text: 'You tell me what is not working. I tell you honestly whether I can help.' },
      { title: 'Quick fix or quote.', text: 'Small things I fix right away, bigger ones get a fixed price.' },
      { title: 'Build.', text: 'I work in your accounts, document every step and test with test contacts before real sign-ups go through.' },
      { title: 'Handover.', text: 'Written instructions, and a short video on request, so your team can maintain everything.' },
    ],
  },

  refs: {
    study: {"title":"Case study: online course creator","before":"Before","after":"After"},
    h2: '*References*',
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
        text: '[…] halten wir Iva Tsatskrialashvili als Dienstleister für Projekte im Bereich Online Marketing und E-Commerce für sehr qualifiziert und möchten ihn ohne jegliche Vorbehalte an potenzielle Auftraggeber weiterempfehlen.',
        translation: '[…] we consider Iva Tsatskrialashvili highly qualified as a service provider for online marketing and e-commerce projects and recommend him to potential clients without any reservations.',
        source: 'Ditoma GmbH, Ludwigsburg',
      },
    },
    quote4: {
      lang: 'en',
      text: 'He was also highly adaptable, quickly learning new tools and processes specific to each project.',
      source: 'Tamar Tsvimitidze, Operations Manager, CMX Solutions (customer support provider)',
    },
  },

  about: {
    h2: 'About *me*',
    photoAlt: 'Iva Tsatskrialashvili',
    paragraphs: [
      "I'm Iva and I live in Graz, Austria. I studied information technology and mobile software development and now study marketing and sales part-time at FH CAMPUS 02. So I understand both: the funnel and the API behind it.",
      'Since 2023 I have worked for online shops, and since 2026 also for online course creators, in Germany, Switzerland, Italy and Austria. I speak German and English at C1 level, Russian and Georgian natively and Spanish at B1.',
      'My business is registered in Austria. You get proper invoices and one person who is responsible.',
    ],
    tools: 'ActiveCampaign, Zapier, Make, Google Apps Script, Leadpages, WordPress, Wix, Shopware, Stripe, Quaderno, Somba, GrooveHQ, Canva, HTML, CSS, JavaScript, Python, SQL',
    path: ['Tbilisi', 'DACH sales since 2020', 'Erasmus+ in 11 countries', 'Graz since 2025'],
    pathLabel: 'My path',
    projects: 'Side projects: GeoAPP and KittyCats',
  },

  notdo: {"label":"What I don't do:","text":"write ad copy, run ads or take over your customer support. I'm happy to recommend colleagues for that."},

  faq: {
    typing: "typing…",
    h2: 'Frequently asked *questions*',
    items: [
      { q: 'Do I need to know about tech?', a: 'No. You tell me what should happen, I take care of the rest and explain everything in plain words.' },
      { q: 'Do you work remotely?', a: 'Yes. Almost all projects run remotely across Europe. In Graz I am happy to meet in person.' },
      { q: 'How soon can you start?', a: 'Quick fixes usually within a week. Projects by arrangement, because I take on only a few at a time.' },
      { q: 'Do I need specific tools?', a: 'No. I work with what you already have and only suggest a switch when it pays off.' },
      { q: 'How do you handle data?', a: 'I get my own user in your accounts, never your password. When the project ends, you remove my access and I delete all copies of your data.' },
      { q: 'Do you also do customer support?', a: 'No. I build the tech that takes load off your support, for example draft replies for recurring questions.' },
      { q: "What if my problem doesn't fit a package?", a: "Send me a short note on what isn't working. You get the price before I start." },
    ],
  },

  contact: {
    h2: "Tell me *what's not working.*",
    text: 'I reply within two working days.',
    free: 'The intro call (20 minutes) is free.',
    mail: 'Write an email',
    subject: 'Enquiry%20via%20mrlololi.com',
    booking: 'Book a call',
    linkedin: 'LinkedIn',
    malt: 'Malt profile',
  },

  // Stage 4 (21.10.2026): copy for the new demos and interfaces (CONTENT.md, section «Stage 4»).
  s4: {
    fixDemo: {
      show: 'Show the fix',
      again: 'Watch again',
      signup: { from: 'Form', to: 'CRM', retry: 'Check + retry', count: '{n}/47 arrived', alt: 'Animation: sign-ups fly from the form to the CRM, two get lost. With «Check + retry» all 47 arrive.' },
      spam: { spam: 'Spam', inbox: 'Inbox', badges: ['SPF', 'DKIM', 'DMARC'], alt: 'Animation: a launch email lands in spam. After SPF, DKIM and DMARC it arrives in the inbox.' },
      rate: { failed: 'Card payment failed', open: 'Course open', steps: ['Reminder 1', 'Reminder 2', 'Access paused', 'Payment in', 'Access open again'], alt: 'Animation: an instalment fails, the course stays open. Then: reminder 1, reminder 2, access paused, payment in, access open again.' },
    },
    story: {
      screen: 'Example screen: sign-up, automation, inbox and course area',
      panes: ['Form', 'Automation', 'Inbox', 'Course area'],
      nodes: [['Trigger', 'Form'], ['Tag', 'Autumn course'], ['Mail', 'Confirmation'], ['Wait', 'until confirmed'], ['Payment', 'Stripe'], ['Invoice', 'Quaderno'], ['Access', 'Somba']],
      tool: 'Email tool',
      mails: [['Please confirm', 'One click and you are in.'], ['Welcome, {first}!', 'Your access is ready.']],
      phone: 'Inbox',
      course: 'Autumn course',
      locked: 'Locked',
      unlocked: 'Unlocked',
      module: 'Module 1: Welcome',
      progress: '0 % done',
      log: 'Log',
    },
    ki: {
      steps: [['Read', 'The email is read.'], ['Spot', 'Request, gaps, mood and deadline get marked.'], ['Draft', 'A draft is written, your team approves it.']],
      legend: { anliegen: 'Request', fehlt: 'Missing', stimmung: 'Mood', dringlichkeit: 'Urgency' },
      legendLabel: 'Highlight legend',
      why: 'Why marked?',
      draftDoes: 'What the draft does with it',
      close: 'Close',
      tag: 'AI draft',
      system: 'What the system would do',
      inbox: 'Inbox (20 examples)',
      counter: '{n} / {total}',
      next: 'Next example →',
      random: 'Random',
      more: '19 more examples',
      mood: 'Mood',
      subject: 'Subject',
      unread: 'unread',
    },
    finder: {
      title: 'Package assistant',
      demo: 'demo, pre-programmed',
      note: 'No real AI, nothing is sent.',
      hello: 'Hi! Three quick questions, then I will show you the package that fits.',
      progress: 'Question {n} of 3',
      typing: 'typing…',
      ask: 'Enquire',
      lines: {
        quick: 'One specific task, done in up to 4 hours.',
        check: 'One day of analysis, then you know where it breaks.',
        launch: 'Everything is ready when sales open.',
        website: 'A one-pager, published and handed over.',
        ki: 'Draft replies your team only has to check.',
      },
    },
    support: {
      label: 'Example calculation',
      meter: 'Hours per month',
      switch: 'per month',
      options: [5, 10, 20],
      total: '{h} h = {eur} €',
      promiseTitle: 'My promise',
      days: ['Day 1', 'Day 14', 'Day 30'],
      stamp: '30-day promise',
    },
    process: {
      icons: ['Calendar', 'Quote', 'Building blocks', 'Key'],
    },
    about: {
      line: "Logic, Loop, Live: that's how I work.",
      stories: [
        'School with a focus on German, then an IT degree in Tbilisi.',
        'Sales for the DACH region, later deputy team lead; then customer support in German at CMX Solutions.',
        'Trainings and youth exchanges: teams, workshops, organisation.',
        'Marketing & Sales degree at FH CAMPUS 02, my own business.',
      ],
      toolsLabel: 'Tools',
    },
    faq: {
      intro: 'Short answers to what I am asked most often.',
      also: 'Also asked:',
      missing: 'Question not here? → Write to me',
      related: [[3, 6], [2, 6], [6, 1], [0, 4], [3, 5], [6, 0], [2, 0]],
    },
    contact: {
      builderLabel: 'Short brief',
      sentence: 'I sell {what} via {via}. The problem is {issue}. Start: {start}.',
      fields: {
        what: ['What', ['an online course', 'a coaching programme', 'a membership', 'a workshop', 'digital products']],
        via: ['Via', ['Leadpages', 'WordPress', 'Wix', 'Somba', 'Skool', 'my own website', 'not decided yet']],
        issue: ['The problem is', ['payments', 'sign-ups', 'emails in spam', 'automations', 'instalments', 'the website']],
        start: ['Start', ['in 4 weeks', 'in 2 weeks', 'right away', 'in 2 to 3 months', 'not decided yet']],
      },
      preview: 'Preview of your email',
      to: 'To',
      subjectLabel: 'Subject',
      subject: 'Enquiry via mrlololi.com',
      greeting: 'Hello Iva,',
      closing: 'Best regards',
      open: 'Open email',
      note: 'Nothing is sent or stored by this page: the email opens in your mail program.',
      bubble: "Tell me what's not working.",
      reply: 'Reply within 2 working days',
      time: 'Local time in Graz: {time}',
      thanks: "Thank you! Once your email arrives, I'll reply within two working days.",
      fallback: 'Nothing opened? Write to {email}',
      copy: 'Copy',
      copied: 'Copied',
      photoAlt: 'Iva Tsatskrialashvili',
    },
    projects: {
      hub: { centre: 'Your launch', parts: ['Checkout', 'Email tool', 'Course platform', 'Payment provider'] },
      site: { url: 'your-website.com', blocks: ['Header', 'Hero', 'Booking', 'Legal notice'] },
      chat: { q: 'Hi, where do I find my login?', a: 'Dear Mia, I have sent your access again. Please also check your spam folder.', tag: 'AI draft' },
    },
    refs: { quotes: 'Testimonials' },
    starter: {
      quick: { title: 'Checkout', broken: 'Broken link', fixed: 'All working', pay: 'Pay' },
      check: ['ActiveCampaign', 'Zapier/Make', 'Payment', 'Landing pages', 'Double opt-in'],
      recommended: 'Recommended start',
    },
  },

  // Identity 21.10.2026: mrlololi = Lo-Lo-Li. The first two letters of each word take the colour of its ball.
  brand: {
    tagline: 'Logic, Loop, Live.',
    // Accessible name of a mascot button in the hero ({name}: Logik, Lösung, Live).
    mascotJump: '{name} jumps',
  },

  footer: {
    copyright: '© 2026 Iva Tsatskrialashvili · Advertising agency (Werbeagentur) · Graz, Austria',
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
      ['Business', 'advertising agency (non-regulated trade, freies Gewerbe)'],
      ['GISA number (Austrian trade register)', '40197975'],
      ['Trade authority', 'Magistrat der Stadt Graz'],
      ['Member of', 'Styrian Economic Chamber (Wirtschaftskammer Steiermark)'],
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
        text: 'This website is hosted on GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). When you visit it, GitHub processes technically necessary data such as your IP address, date and time, the page requested and browser information in order to deliver the page and keep it secure. The legal basis is my legitimate interest in secure and reliable operation (Art. 6(1)(f) GDPR). Data may be transferred to the USA in the process.',
        dpf: 'GitHub is certified under the EU-US Data Privacy Framework; the transfer to the USA relies on it (Art. 45 GDPR).',
      },
      { key: 'cookies', title: 'No cookies, no analytics', text: "This website sets no cookies and uses no analytics or tracking tools. Fonts and scripts are loaded from the website's own server." },
      { key: 'email', title: 'Contact by email', text: 'If you write to me, I process your details in order to answer your enquiry (Art. 6(1)(b) GDPR, for general enquiries Art. 6(1)(f) GDPR). Emails to hello@mrlololi.com are forwarded via Cloudflare Email Routing (Cloudflare, Inc., USA) to my mailbox at Google (Gmail). The transfer to the USA relies on the EU-US Data Privacy Framework (Art. 45 GDPR). I delete enquiries that do not lead to an assignment after 12 months at the latest. If an assignment follows, I keep business-relevant correspondence until the statutory retention period ends (usually 7 years, § 132 BAO).' },
      { key: 'booking', title: 'Booking a call', text: 'The “Book a call” button leads to an external provider. Its privacy policy applies there. Data is only transferred when you click the link.' },
      { key: 'links', title: 'External links', text: 'Links to LinkedIn, Malt or reference websites lead to third-party sites. Data is only transferred to these providers when you click them.' },
      // Privacy addition 28.10.2026 (translation of the German text).
      { key: 'langstarter', title: 'Language Starter (Webprojekte)', text: 'The “Anhören” (listen) feature in Language Starter (mrlololi.com/Webprojekte/language-starter) uses the speech output of your browser or device. With some voices, for example the “Google” voices in Google Chrome, the sentence to be read aloud is sent to the browser maker’s speech service to be turned into speech. I do not transmit any data myself. The app sets no cookies, uses no tracking and stores your learning progress only locally in your browser (localStorage).' },
      { key: 'rights', title: 'Your rights', text: 'Access, rectification, erasure, restriction of processing, data portability and objection (Art. 15 to 21 GDPR). Write to {email}.' },
      { key: 'complaint', title: 'Complaints', text: 'You can lodge a complaint with the Austrian Data Protection Authority: Barichgasse 40-42, 1030 Vienna, www.dsb.gv.at.' },
    ],
  },
};
