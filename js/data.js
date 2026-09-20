// Content data for the three personas — Designer, Traveller, Mother
// Mirrors the live base44 CMS content pixel-for-pixel.

const PERSONAS = ["designer", "traveller", "mother"];

const PERSONA_LABELS = {
  designer: "Designer",
  traveller: "Traveller",
  mother: "Mother",
};

const CONTACT_EMAIL = "maharaninadya@gmail.com";

// Icon paths follow the same lucide-style stroke convention used across the
// site/CMS — simplified recognizable glyphs, not literal brand logos.
const SOCIAL_PLATFORMS = {
  instagram: {
    label: "Instagram",
    icon: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>',
  },
  tiktok: {
    label: "TikTok",
    icon: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>',
  },
  linkedin: {
    label: "LinkedIn",
    icon: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle>',
  },
  twitter: {
    label: "X (Twitter)",
    icon: '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>',
  },
  facebook: {
    label: "Facebook",
    icon: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>',
  },
  youtube: {
    label: "YouTube",
    icon: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path>',
  },
  email: {
    label: "Email",
    icon: '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>',
  },
  website: {
    label: "Website",
    icon: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
  },
};

const SITE = {
  designer: {
    headline: "A Digital Product Designer",
    greeting: "Hi 👋 I'm Nadya",
    tagline: "Part-time digital product experience crafter. Full-time mom. Singapore based 🇸🇬",
    avatar: "/assets/avatar-designer.webp",
    resumeUrl: "",
    availableForWork: false,
    badgeEmoji: "🎨",
    stickers: ["✨", "◆"],
    showResumeActions: true,
    marqueeUnits: 3,
    marqueeImages: [],
    socials: [],
    aboutHeading: "About Me",
    aboutText:
      "I'm Nadya, a curious mind who thrives to learn new things from design, content creation, and everything in between.",
    worksHeading: "Selected Works",
    selectedWorkIds: [
      "sea-labs-design-system",
      "tokopedia-travel-product-redesign",
      "unifying-sg-customs-officer-internal-site",
    ],
    works: [
      {
        id: "sea-labs-design-system",
        title: "Sea Labs Design System",
        description: "Built a cross-platform design system used across Shopee, Garena, and SeaMoney.",
        year: "2022",
        company: "Sea Group Ltd.",
        tags: ["Design System", "Multi-platform"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
      {
        id: "tokopedia-travel-product-redesign",
        title: "Tokopedia Travel Product Redesign",
        description: "Redesigned Tokopedia's travel booking flow to lift conversion on mobile.",
        year: "2020",
        company: "Tokopedia",
        tags: ["Mobile", "UX", "Travel"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
      {
        id: "unifying-sg-customs-officer-internal-site",
        title: "Unifying SG Customs Officer Internal Site",
        description: "Consolidated multiple internal tools into a single design system for customs officers.",
        year: "2025",
        company: "Ufinity / GovTech",
        tags: ["Web", "Design System"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
    ],
    showExperience: true,
    experience: [
      {
        id: "ufinity",
        type: "work",
        organization: "Ufinity Pte. Ltd.",
        role: "Sr. Product Designer",
        period: "2023 - Present",
        location: "Full-time • Singapore",
        description:
          "Ufinity is a Singapore IT agency providing services from IT systems, design, and full-fledged agile teams to support public sector (Singapore's Government) as well as private sectors.",
        highlights: [
          "Sr. Product Designer @ GovTech GatherSG",
          "Sr. Product Designer @ MOE (SLS)",
          "Sr. Product Designer @ GovTech TradeNet",
        ],
      },
      {
        id: "sea-group",
        type: "work",
        organization: "Sea Group Ltd.",
        role: "Product Designer",
        period: "2021 - 2022",
        location: "Full-time • Singapore",
        description:
          "Sea Limited is a leading global consumer internet company founded in Singapore and is a parent company to Shopee, Garena, and SeaMoney.",
        highlights: ["Product Designer @ Labs"],
      },
      {
        id: "tokopedia",
        type: "work",
        organization: "Tokopedia",
        role: "Senior UX Designer",
        period: "2017 - 2021",
        location: "Full-time • Jakarta, Indonesia",
        description:
          "Tokopedia is one of Indonesia's unicorn tech companies that started off as an online marketplace and is now on its way to become a super ecosystem.",
        highlights: [
          "Senior UX Designer (Merchant Growth)",
          "Senior UX Designer (Travel Products)",
          "UX Designer (Digital Goods)",
        ],
      },
      {
        id: "ugm",
        type: "education",
        organization: "Universitas Gadjah Mada",
        role: "Bachelor's Degree in Information Technology",
        period: "2012 - 2016",
        location: "Yogyakarta, Indonesia",
        description: "GPA 3.7 of 4",
        highlights: [],
      },
      {
        id: "binar-academy",
        type: "education",
        organization: "Binar Academy",
        role: "UX Design Bootcamp",
        period: "2017",
        location: "Indonesia",
        description: "Intensive UX design bootcamp.",
        highlights: [],
      },
    ],
    showTestimonials: true,
    testimonials: [
      {
        id: "rizky-pratama",
        quote:
          "Working with Nadya was a masterclass in user-centered design. She always pushed the team to think deeper about the 'why' before the 'how'.",
        letter: "R",
        name: "Rizky Pratama",
        role: "Engineering Lead @ Tokopedia",
      },
      {
        id: "sarah-chen",
        quote:
          "Nadya brings a rare combination of craft and empathy to everything she designs. Her work on our internal portal transformed how our officers interact with complex systems.",
        letter: "S",
        name: "Sarah Chen",
        role: "Head of Product @ GovTech",
      },
    ],
  },

  traveller: {
    headline: "A Wandering Storyteller",
    greeting: "Hi ✈️ I'm Nadya",
    tagline: "Chasing sunsets, street food & stories across continents. Singapore based 🇸🇬",
    avatar: "/assets/avatar-traveller.jpeg",
    resumeUrl: "",
    availableForWork: false,
    badgeEmoji: "🧭",
    stickers: ["☀️", "〰️"],
    showResumeActions: false,
    marqueeUnits: 2,
    marqueeImages: [],
    socials: [],
    aboutHeading: "About Me",
    aboutText:
      "Travelling is how I recharge. Every trip teaches me something new — about the world, and about myself.",
    worksHeading: "Travel Stories",
    worksSeeMore: true,
    works: [
      {
        id: "48-hours-in-kyoto",
        title: "48 Hours in Kyoto: A Visual Diary",
        description: "A whirlwind 48 hours through temples, ramen shops, and quiet alleyways.",
        year: "2024",
        company: "Japan",
        tags: ["Japan", "City Guide", "48hrs"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
      {
        id: "solo-trip-bali-on-a-budget",
        title: "Solo Trip: Bali on a Budget",
        description: "How I explored Bali solo without blowing the budget.",
        year: "2023",
        company: "Indonesia",
        tags: ["Bali", "Solo", "Budget"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
      {
        id: "backpacking-through-vietnam",
        title: "Backpacking Through Vietnam",
        description: "Three weeks backpacking from Hanoi to Ho Chi Minh City.",
        year: "2022",
        company: "Vietnam",
        tags: ["Vietnam", "Backpacking", "Adventure"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
    ],
    showExperience: false,
    experience: [],
    showTestimonials: false,
    testimonials: [],
    countriesVisited: [
      { flag: "🇸🇬", name: "Singapore" },
      { flag: "🇯🇵", name: "Japan" },
      { flag: "🇮🇩", name: "Indonesia" },
      { flag: "🇻🇳", name: "Vietnam" },
      { flag: "🇹🇭", name: "Thailand" },
      { flag: "🇰🇷", name: "South Korea" },
      { flag: "🇮🇹", name: "Italy" },
    ],
  },

  mother: {
    headline: "A Mom Figuring It Out",
    greeting: "Hi 💗 I'm Nadya",
    tagline: "Navigating parenthood one beautiful, chaotic day at a time. 💗",
    avatar: "/assets/avatar-mother.jpeg",
    resumeUrl: "",
    availableForWork: false,
    badgeEmoji: "🌸",
    stickers: ["⭐", "♥"],
    showResumeActions: false,
    marqueeUnits: 1,
    marqueeImages: [],
    socials: [],
    tiktokHandle: "diaryasamom",
    tiktokVideos: [
      { url: "https://www.tiktok.com/@diaryasamom/video/7681694945362595093" },
      { url: "https://www.tiktok.com/@diaryasamom/video/7680589306431409428" },
      { url: "https://www.tiktok.com/@diaryasamom/video/7679117762249166100" },
    ],
    aboutHeading: "About Me",
    aboutText:
      "Being a mom is the hardest and most rewarding thing I've ever done. I share the honest, messy, wonderful journey here.",
    worksHeading: "My Stories",
    works: [
      {
        id: "our-montessori-inspired-home-setup",
        title: "Our Montessori-inspired home setup",
        description: "How we set up our home to support independent play and learning.",
        year: "2024",
        company: "Home",
        tags: ["Montessori", "Interior", "Parenting"],
        content: "",
        coverImage: "",
        featured: false,
        published: true,
      },
    ],
    showExperience: false,
    experience: [],
    showTestimonials: false,
    testimonials: [],
  },
};

const ABOUT = {
  intro: [
    "I'm <strong>Nadya</strong> Arizka a product designer based in Singapore with 9 years of experience in product design.",
    "I have developed a passion for user interface and user experience design. I've always enjoyed engaging with people and discovering the secrets to people's relationships with technology which attracted me to learn more about user experience and fell in love with it more each day.",
    "I received a Bachelor's degree in Information Technology. As an IT graduate, knowing basic knowledge about product development has helped me to understand the feasibility of products that I design.",
  ],
  personaText: {
    designer:
      "I'm **Nadya** Arizka, a product designer based in Singapore with 9 years of experience in product design.\n\nI have developed a passion for user interface and user experience design. I've always enjoyed engaging with people and discovering the secrets to people's relationships with technology, which attracted me to learn more about user experience and fell in love with it more each day.\n\nI received a Bachelor's degree in Information Technology. As an IT graduate, knowing basic knowledge about product development has helped me to understand the feasibility of products that I design.",
    traveller:
      "I'm **Nadya**, and I've been travelling since before it was an aesthetic. From backpacking across Indonesia to weekend escapes in Southeast Asia — travel is my second language.\n\nEvery destination leaves a mark. I collect experiences over souvenirs.",
    mother:
      "I'm **Nadya**, a mom based in Singapore. Motherhood was the plot twist I never planned for — and the greatest adventure of my life.\n\nI share snippets of our daily life, learnings, and the things that keep me sane (coffee, journaling, and good podcasts).",
  },
  skills: [
    "User Research",
    "User Interface Design",
    "User Experience Design",
    "User Research",
    "User Interface Design",
    "User Experience Design",
  ],
  tools: ["Figma", "Protopie", "Notion", "FigJam", "Figma", "Protopie", "Notion", "FigJam"],
};
