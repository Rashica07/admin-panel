export const defaultPortfolioContent = {
  nav: { home: "Home", services: "Services", portfolio: "Work", blog: "Writing", about: "About", contact: "Contact", quote: "Start a Project" },
  hero: {
    badge: "Available for new projects · Kosovo / Italy",
    h1Line1: "I build digital products",
    h1Line2: "your customers",
    h1Line3: "actually use —",
    h1Line4: "and come back to.",
    sub: "I take ideas from a conversation to a live product. Apps, websites, and online platforms — built to perform, delivered on time, no surprises.",
    cta1: "Tell me about your project",
    cta2: "See my work",
    available: "Taking on new projects from August 2026"
  },
  services: {
    label: "Services",
    title: "Clear price. Clear scope. Done.",
    sub: "No hidden costs, no delays, no middlemen. Every project comes with a fixed price and a delivery date I stand behind.",
    getProposal: "Get a proposal for this service",
    items: [
      {
        name: "Mobile App",
        tagline: "Your idea, live on the App Store and Google Play in 6 weeks.",
        price: "From €799",
        timeline: "6 weeks",
        desc: "I build your app from start to finish — design, development, and submission to both stores. One fixed price, one point of contact, six weeks.",
        features: ["React Native", "iOS & Android", "Supabase", "App Store & Play Store submission", "Push notifications", "30-day support after launch"]
      },
      {
        name: "Landing Page",
        tagline: "A website that makes people stop and pay attention — in 7 days.",
        price: "From €299",
        timeline: "7 days",
        desc: "A fast, good-looking page built to turn visitors into customers. Delivered in 7 days, ready to generate leads from day one.",
        features: ["Next.js", "3D visuals & animations", "Optimised for search engines", "Fast load on all devices", "Vercel + Cloudflare", "Ready for a content system"]
      },
      {
        name: "Web Platform",
        tagline: "A full product on the web — accounts, payments, dashboards — in 3 weeks.",
        price: "From €1,299",
        timeline: "3 weeks",
        desc: "Everything your business needs in one product: user accounts, payments, dashboards, and more. Built to handle real usage from day one.",
        features: ["Next.js", "Supabase / PostgreSQL", "User accounts & login", "Admin dashboard", "Live data updates", "Deployment included"]
      },
      {
        name: "Custom Backend",
        tagline: "The foundation your product needs — built in 2 weeks.",
        price: "From €499",
        timeline: "2 weeks",
        desc: "A solid, reliable backbone for your app or website. Built to scale as your business grows, with full documentation handed over at the end.",
        features: ["Node.js", "PostgreSQL", "Login & user management", "File storage", "Live data sync", "Full documentation"]
      }
    ]
  },
  work: {
    label: "Selected Work",
    title: "Real projects. Real results.",
    projects: [
      {
        name: "Torre Group",
        type: "Web",
        status: "Live",
        year: "2024",
        desc: "A corporate web platform for Torre Group, comprising MAGFA GROUP, SWISSTECH, TORRE DI UMBRIA, and TORRE HOME. Premium design reflecting high-quality construction and real estate.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS"]
      },
      {
        name: "Spindare",
        type: "Mobile",
        status: "In Development",
        year: "2025–2026",
        desc: "A social app where users earn rewards for their daily habits. I led the entire product — from the first screen to launch preparation. Shipping on iOS this September.",
        stack: ["React Native", "TypeScript", "Supabase", "Clerk", "Expo"]
      },
      {
        name: "TravelMe",
        type: "Mobile",
        status: "Coming Soon",
        year: "2026",
        desc: "An app that plans your entire trip from a single message. Tell it where you want to go and what you're into, and it handles everything else.",
        stack: ["React Native", "OpenAI API", "Node.js", "MongoDB"]
      },
      {
        name: "KIQA DEV",
        type: "Web",
        status: "Live",
        year: "2026",
        desc: "This site — built in four languages, with smooth animations and a 3D background. Designed to get clients to reach out.",
        stack: ["Next.js", "TypeScript", "Three.js", "Framer Motion"]
      }
    ]
  },
  stats: [
    { value: "150k+", label: "Lines written for live products" },
    { value: "3+", label: "Years building professionally" },
    { value: "4", label: "Languages spoken" },
    { value: "6wk", label: "From idea to App Store" }
  ],
  process: {
    label: "How it works",
    title: "Simple from start to finish",
    steps: [
      { n: "01", title: "We talk", desc: "A 30-minute call to understand what you need, when you need it, and what a good result looks like. No commitment." },
      { n: "02", title: "You get a proposal", desc: "A written breakdown — what I'll build, what it costs, and when it'll be done. In your inbox within 24 hours." },
      { n: "03", title: "I build it", desc: "Regular updates, early previews, and a direct line to me throughout. You're never left wondering." },
      { n: "04", title: "You go live", desc: "Your product launches. I hand over everything — code, accounts, documentation — plus 30 days of support." }
    ]
  },
  testimonials: [
    { quote: "Kristian delivered our landing page in under a week. Clean work, zero revisions, and clear communication throughout. Rare for any developer, let alone one this young.", name: "Marco V.", role: "Startup founder", location: "Milan, Italy" },
    { quote: "Working with Kiqa on Spindare has been impressive. He approaches every problem with discipline and care that usually takes years to develop.", name: "Biba W.", role: "Co-founder, Spindare", location: "Kosovo" },
    { quote: "He built a full booking and payments flow for my business in two weeks. Payments, email notifications, everything. Agencies I've worked with couldn't get close.", name: "Luca R.", role: "Business owner", location: "Lecco, Italy" }
  ],
  funnel: {
    label: "Start a Project",
    title: "Tell me about your project",
    sub: "Fill in the form below and I'll come back to you with a clear plan within 24 hours.",
    fields: {
      name: "Your name", namePh: "Your full name",
      email: "Business email", emailPh: "you@company.com",
      company: "Company or project name", companyPh: "Acme Ltd or your project name",
      service: "What do you need?",
      serviceOptions: ["Mobile App", "Landing Page", "Web Platform", "Custom Backend", "Not sure yet — let's talk"],
      budget: "Budget",
      budgetOptions: ["Under €500", "€500 – €1,500", "€1,500 – €3,000", "€3,000+", "Not sure yet"],
      timeline: "When do you need it?",
      timelineOptions: ["As soon as possible", "Within a month", "2–3 months", "No rush"],
      description: "Tell me about the project",
      descriptionPh: "What are you building, who is it for, and what does success look like for you?",
      submit: "Send my project brief",
      submitting: "Sending..."
    },
    success: { title: "Got it — I'll be in touch.", sub: "I'll review your brief and send you a clear proposal within 24 hours." }
  },
  about: {
    label: "About",
    title: "Kristian Gjergji",
    sub: "Developer · Builder · Founder",
    bio: [
      "I'm a self-employed developer based between Kosovo and Italy. I build mobile apps, websites, and web platforms for startups and business owners who need things done properly — and on time.",
      "Right now I'm co-leading product development on Spindare, a social app with hundreds of screens and a launch on iOS planned for September 2026.",
      "Through KIQA DEV, I work directly with founders and business owners — handling everything from the first design to going live — so they don't have to manage multiple agencies or freelancers."
    ],
    skills: [
      { name: "Mobile", items: ["React Native", "Expo", "iOS / Android", "EAS Build", "App Store Deployment"] },
      { name: "Frontend", items: ["TypeScript", "JavaScript", "React", "Next.js", "Tailwind CSS"] },
      { name: "Backend & Data", items: ["Supabase", "PostgreSQL", "Node.js", "REST APIs", "Real-time sync"] },
      { name: "Tools", items: ["Git", "Vercel", "Cloudflare", "Figma", "Stream Chat"] }
    ],
    experience: [
      { year: "2025–Now", role: "Co-Founder & Lead Developer — Spindare", desc: "Leading the full product build for a social rewards app — hundreds of screens, a full design system, and a launch date in September 2026." },
      { year: "2024–Now", role: "Founder — KIQA DEV", desc: "Running my own development practice. Working directly with startups and business owners across Italy and beyond." },
      { year: "2022–Now", role: "Self-Taught Developer", desc: "Started from zero in 2022. Spent three years building real products — not tutorials." }
    ],
    values: [
      { title: "I build, not just plan", desc: "I'd rather put something real in front of you in two weeks than spend months planning the perfect version." },
      { title: "I deliver on time", desc: "A deadline is a deadline. I've never shipped late and I don't plan to start." },
      { title: "I keep it simple", desc: "Clean solutions beat clever ones. I build things that are easy to understand, maintain, and grow." },
      { title: "I see it through", desc: "Once I take on a project, I see it to the end. You'll never wonder where I am." }
    ],
    stackLabel: "Stack",
    stackTitle: "Tech Stack",
    experienceLabel: "Experience",
    experienceTitle: "Timeline",
    approachLabel: "Approach",
    approachTitle: "How I work",
    ctaTitle: "Want to work together?",
    ctaSub: "Open to select freelance projects starting August 2026.",
    ctaButton: "Get in touch",
    metaLocation: "Location",
    metaLocationValue: "Lecco, Italy · Kosovo",
    metaFocus: "Focus",
    metaFocusValue: "Mobile-first development",
    metaAvailable: "Available",
    metaAvailableValue: "August 2026",
    metaResponse: "Response time",
    metaResponseValue: "Within 24h"
  },
  blog: {
    label: "Writing",
    title: "Notes from the work",
    sub: "Real stories from projects I've worked on — what went wrong, what worked, and what I'd do differently.",
    readMore: "Read post",
    minRead: "min read",
    noPosts: "No posts in this category yet.",
    latestNotes: "Latest Notes.",
    viewAllWriting: "View all writing",
    postNotFound: "Post not found",
    postNotFoundDesc: "This article doesn't exist or hasn't been published yet.",
    backToWriting: "Back to writing",
    byAuthor: "by",
    comingSoon: "Coming soon",
    comingSoonDesc: "Full article content is being written. Check back soon.",
    followGithub: "Follow on GitHub",
    writtenBy: "Written by",
    authorRole: "Developer · Kosovo / Italy",
    workWithMe: "Work with me →",
    readArticle: "Read article",
    categories: ["All", "React Native", "Architecture", "Backend", "Design", "AI"],
    posts: [
      { slug: "flatlist-memory-leak", category: "React Native", title: "How I fixed a memory leak that was crashing Spindare's social feed", excerpt: "The feed was slowing to a halt after a few minutes of use. Here's how I tracked down the problem and fixed it.", date: "Mar 28, 2026", read: 7 },
      { slug: "auth-flow-48-hours", category: "Architecture", title: "Why I rebuilt Spindare's login system in 48 hours — and don't regret it", excerpt: "The old setup worked fine until it didn't. An honest account of the decision, the rebuild, and what I'd do differently.", date: "Mar 14, 2026", read: 9 },
      { slug: "supabase-vs-firebase", category: "Backend", title: "Supabase vs Firebase for a social feed: what I found after testing both properly", excerpt: "I needed live updates for a large number of users at the same time. Both tools promised it. Only one delivered.", date: "Feb 22, 2026", read: 11 },
      { slug: "react-native-design-system", category: "Design", title: "How we built a design system for a mobile app with hundreds of screens", excerpt: "When your app has hundreds of components and a small team, having a shared set of rules isn't optional. This is how we did it.", date: "Feb 8, 2026", read: 8 },
      { slug: "travelme-ai-weekend", category: "AI", title: "How I built TravelMe's AI trip planner in a weekend", excerpt: "One message, a full itinerary. I had a weekend and an OpenAI API key. This is what I built, what surprised me, and what didn't work.", date: "Jun 12, 2026", read: 6 },
      { slug: "travelme-openai-vs-gemini", category: "AI", title: "Why I chose OpenAI over Gemini for TravelMe's recommendations engine", excerpt: "I tested both models properly for two weeks. The answer wasn't about price — it was about what happens when you tell the AI someone has a dietary restriction.", date: "Jun 20, 2026", read: 8 },
      { slug: "travelme-when-ai-is-wrong", category: "AI", title: "The hardest part of building an AI travel app: when the AI is confident and wrong", excerpt: "A restaurant that closed two years ago. Visa requirements that are out of date. The AI says it with full confidence. Here's how I'm handling it.", date: "Jun 25, 2026", read: 7 }
    ]
  },
  contact: {
    label: "Contact",
    title: "Get in touch",
    sub: "Tell me about your project and I'll get back to you within 24 hours.",
    detailsTitle: "Contact details",
    bookTitle: "Prefer to book directly?",
    bookDesc: "For immediate engagement, Discord is the fastest channel.",
    form: {
      name: "Your name", namePh: "Your full name",
      email: "Email address", emailPh: "you@example.com",
      subject: "Subject", subjectPh: "Project inquiry",
      message: "Message", messagePh: "Tell me about your project, when you need it, and your budget...",
      send: "Send Message", sending: "Sending...",
      sent: "Message sent.", sentSub: "I'll get back to you within 24 hours.",
      another: "Send another message"
    },
    chat: {
      intro: "Quick intake",
      greeting: "Hey — I'm the KIQA intake assistant. Three quick questions and I'll pass this straight to Kristian.",
      qService: "What kind of work do you need?",
      qTimeline: "What's your timeline?",
      qDescription: "Tell me a bit about the project.",
      descriptionPh: "What are you building, and what does a good result look like?",
      qName: "Nice — what's your name?",
      namePh: "Your full name",
      qMethod: "Last thing — how should Kristian reach you?",
      methodEmail: "Email",
      methodPhone: "Phone",
      emailPh: "you@example.com",
      phonePh: "+355 6X XXX XXXX",
      submit: "Send to Kristian",
      sending: "Sending...",
      typing: "typing",
      summaryIntro: "Here's what I've got:",
      restart: "Start over",
      switchMethod: "Switch to",
      phoneUnavailableTitle: "Phone unavailable",
      phoneUnavailableDesc: "Phone contact is currently unavailable. Please use email instead.",
      errorTitle: "Error",
      errorDesc: "Failed to send. Please email contact@kiqa-dev.it directly."
    },
    info: { email: "contact@kiqa-dev.it", discord: "@kodibkfg", github: "github.com/rashica07", location: "Kosovo / Italy", response: "Within 24 hours" }
  },
  footer: { tagline: "Quality work. Fixed price. On time.", legal: "© 2026 KIQA DEV. All rights reserved." },
  whatsapp: { tooltip: "Chat on WhatsApp", aria: "Message us on WhatsApp", prefill: "Hi Kristian, I'd like to talk about a project." },
  notFound: {
    title: "Page Not Found",
    description: "The page you are looking for does not exist.",
    backHome: "← Back to home"
  },
  page: {
    allServices: "All services & pricing",
    viewAllProjects: "View all projects"
  },
  portfolio: {
    noProjects: "No projects in this category yet.",
    ctaTitle: "Want to see your project here?",
    ctaSub: "Let's build something production-grade together.",
    ctaButton: "Start a project"
  }
};
