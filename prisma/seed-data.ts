/** Catalogue used by the seed script. Prices are baisa (1 OMR = 1000 baisa). */

export type SeedCategory = {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  colors: [string, string];
};

export const categories: SeedCategory[] = [
  {
    slug: "home-appliances",
    nameEn: "Home Appliances",
    nameAr: "الأجهزة المنزلية",
    descriptionEn: "Refrigerators, washing machines, air conditioners and everyday appliances built for Omani homes.",
    descriptionAr: "ثلاجات وغسالات ومكيفات وأجهزة يومية صُمّمت لتناسب البيت العُماني.",
    icon: "Refrigerator",
    colors: ["#0F5F5A", "#2BB3A3"],
  },
  {
    slug: "electrical-lighting",
    nameEn: "Electrical & Lighting",
    nameAr: "الكهرباء والإنارة",
    descriptionEn: "Energy-saving LED lighting, cables, sockets and electrical testing equipment.",
    descriptionAr: "إنارة LED موفّرة للطاقة، وكابلات ومقابس، وأجهزة فحص كهربائية.",
    icon: "Lightbulb",
    colors: ["#A16207", "#E0B565"],
  },
  {
    slug: "tools-hardware",
    nameEn: "Tools & Hardware",
    nameAr: "العِدد والأدوات",
    descriptionEn: "Power tools, hand tools and ladders for professionals and home workshops.",
    descriptionAr: "عِدد كهربائية ويدوية وسلالم للمحترفين ولورش المنازل.",
    icon: "Drill",
    colors: ["#1E3A5F", "#3B82F6"],
  },
  {
    slug: "building-materials",
    nameEn: "Building Materials",
    nameAr: "مواد البناء",
    descriptionEn: "Cement, blocks, tiles, paint and waterproofing for construction and renovation projects.",
    descriptionAr: "إسمنت وطابوق وبلاط ودهانات ومواد عزل لمشاريع البناء والترميم.",
    icon: "BrickWall",
    colors: ["#7C4A2D", "#C8963E"],
  },
  {
    slug: "plumbing-sanitary",
    nameEn: "Plumbing & Sanitary",
    nameAr: "السباكة والأدوات الصحية",
    descriptionEn: "Taps, showers, water heaters, pumps, pipes and bathroom fittings.",
    descriptionAr: "خلاطات ودشّات وسخانات مياه ومضخات وأنابيب وتجهيزات الحمّامات.",
    icon: "ShowerHead",
    colors: ["#0E7490", "#22D3EE"],
  },
  {
    slug: "kitchen-household",
    nameEn: "Kitchen & Household",
    nameAr: "المطبخ والمنزل",
    descriptionEn: "Cookware, small kitchen appliances and practical storage for the home.",
    descriptionAr: "أواني طهي وأجهزة مطبخ صغيرة وحلول تخزين عملية للمنزل.",
    icon: "CookingPot",
    colors: ["#9F1239", "#FB7185"],
  },
];

type Spec = [keyEn: string, keyAr: string, valueEn: string, valueAr: string];

export type SeedProduct = {
  slug: string;
  category: string;
  nameEn: string;
  nameAr: string;
  brand: string;
  price: number;
  compareAt?: number;
  stock: number;
  icon: string;
  featured?: boolean;
  warranty: number; // years, 0 = none
  descEn: string;
  descAr: string;
  specs: Spec[];
};

export const products: SeedProduct[] = [
  // ── Home Appliances ───────────────────────────────────────────────
  {
    slug: "majan-2-door-refrigerator-420l", category: "home-appliances", icon: "Refrigerator",
    nameEn: "Majan 2-Door Refrigerator 420 L", nameAr: "ثلاجة ماجان بابين 420 لتر",
    brand: "Majan", price: 189_000, compareAt: 215_000, stock: 14, featured: true, warranty: 2,
    descEn: "A spacious frost-free refrigerator with an inverter compressor that stays quiet and efficient, even through the hottest Omani summer.",
    descAr: "ثلاجة واسعة بنظام منع التجمّد وضاغط إنفرتر يعمل بهدوء وكفاءة حتى في ذروة الصيف العُماني.",
    specs: [["Capacity", "السعة", "420 litres", "420 لتراً"], ["Energy rating", "تصنيف الطاقة", "4 stars", "4 نجوم"], ["Climate class", "فئة المناخ", "T (tropical)", "T (استوائي)"]],
  },
  {
    slug: "sahil-front-load-washer-8kg", category: "home-appliances", icon: "WashingMachine",
    nameEn: "Sahil Front-Load Washing Machine 8 kg", nameAr: "غسالة ساحل بتحميل أمامي 8 كجم",
    brand: "Sahil", price: 149_500, stock: 9, featured: true, warranty: 2,
    descEn: "Fifteen wash programmes, a 1,200 rpm spin and a quick 30-minute cycle for busy family laundry days.",
    descAr: "خمسة عشر برنامج غسيل، ودوران بسرعة 1200 لفّة في الدقيقة، ودورة سريعة مدتها 30 دقيقة لأيام الغسيل المزدحمة.",
    specs: [["Load capacity", "سعة الحمولة", "8 kg", "8 كجم"], ["Spin speed", "سرعة الدوران", "1,200 rpm", "1200 لفّة/دقيقة"], ["Programmes", "البرامج", "15", "15"]],
  },
  {
    slug: "falaj-split-ac-1-5-ton", category: "home-appliances", icon: "AirVent",
    nameEn: "Falaj Split Air Conditioner 1.5 Ton", nameAr: "مكيف سبليت فلج 1.5 طن",
    brand: "Falaj", price: 219_000, compareAt: 245_000, stock: 4, featured: true, warranty: 3,
    descEn: "An inverter split unit rated for 52 °C outdoor temperatures, with gold-fin coils that resist coastal humidity and salt.",
    descAr: "مكيف سبليت بتقنية الإنفرتر يعمل بكفاءة حتى 52 درجة مئوية، بملفات مطلية بالذهب تقاوم رطوبة الساحل وملوحته.",
    specs: [["Cooling capacity", "قدرة التبريد", "18,000 BTU", "18,000 وحدة حرارية"], ["Max. outdoor temp.", "أقصى حرارة خارجية", "52 °C", "52 °م"], ["Refrigerant", "غاز التبريد", "R410A", "R410A"]],
  },
  {
    slug: "nizwa-pro-pedestal-fan-18", category: "home-appliances", icon: "Fan",
    nameEn: "Nizwa Pro Pedestal Fan 18\"", nameAr: "مروحة أرضية نزوى برو 18 بوصة",
    brand: "Nizwa Pro", price: 14_750, stock: 40, warranty: 1,
    descEn: "Five-blade pedestal fan with remote control, three speeds and a 7.5-hour timer.",
    descAr: "مروحة أرضية بخمس شفرات مع جهاز تحكم عن بُعد وثلاث سرعات ومؤقّت حتى 7.5 ساعات.",
    specs: [["Blade size", "قطر الشفرات", "18 in", "18 بوصة"], ["Power", "القدرة", "65 W", "65 واط"]],
  },
  {
    slug: "dhofar-home-microwave-25l", category: "home-appliances", icon: "Microwave",
    nameEn: "Dhofar Home Microwave Oven 25 L", nameAr: "فرن ميكروويف ظفار هوم 25 لتر",
    brand: "Dhofar Home", price: 32_900, stock: 0, warranty: 1,
    descEn: "Microwave with grill, ten power levels and auto-cook menus for quick family meals.",
    descAr: "ميكروويف مع شوّاية وعشرة مستويات للطاقة وقوائم طهي تلقائية لوجبات عائلية سريعة.",
    specs: [["Capacity", "السعة", "25 litres", "25 لتراً"], ["Power", "القدرة", "900 W", "900 واط"]],
  },
  {
    slug: "qurum-steam-iron-2400w", category: "home-appliances", icon: "Shirt",
    nameEn: "Qurum Steam Iron 2400 W", nameAr: "مكواة بخار القرم 2400 واط",
    brand: "Qurum", price: 9_500, stock: 55, warranty: 1,
    descEn: "Ceramic soleplate, vertical steam and anti-drip system for crisp dishdashas and shirts.",
    descAr: "قاعدة سيراميك وبخار عمودي ونظام منع التنقيط لكيّ الدشاديش والقمصان بإتقان.",
    specs: [["Power", "القدرة", "2,400 W", "2400 واط"], ["Steam boost", "دفعة البخار", "180 g/min", "180 غ/دقيقة"]],
  },
  {
    slug: "majan-bagless-vacuum-2000w", category: "home-appliances", icon: "Wind",
    nameEn: "Majan Bagless Vacuum Cleaner 2000 W", nameAr: "مكنسة كهربائية ماجان بدون كيس 2000 واط",
    brand: "Majan", price: 38_000, stock: 18, warranty: 2,
    descEn: "Cyclonic bagless vacuum with a washable HEPA filter that copes well with fine desert dust.",
    descAr: "مكنسة بنظام الإعصار دون أكياس، مع فلتر HEPA قابل للغسل يتعامل بكفاءة مع غبار الصحراء الناعم.",
    specs: [["Power", "القدرة", "2,000 W", "2000 واط"], ["Dust capacity", "سعة الغبار", "2.5 litres", "2.5 لتر"]],
  },

  // ── Electrical & Lighting ─────────────────────────────────────────
  {
    slug: "led-bulb-e27-12w-pack-4", category: "electrical-lighting", icon: "Lightbulb",
    nameEn: "LED Bulb E27 12 W (Pack of 4)", nameAr: "مصابيح LED قاعدة E27 بقدرة 12 واط (عبوة 4)",
    brand: "Wadi Select", price: 3_200, stock: 120, warranty: 1,
    descEn: "Warm-white LED bulbs that replace 100 W incandescent lamps and last up to 15,000 hours.",
    descAr: "مصابيح LED بإضاءة دافئة تعادل مصباحاً تقليدياً بقدرة 100 واط، ويصل عمرها إلى 15,000 ساعة.",
    specs: [["Wattage", "القدرة", "12 W", "12 واط"], ["Colour temperature", "درجة اللون", "3000 K", "3000 كلفن"], ["Lifespan", "العمر الافتراضي", "15,000 h", "15,000 ساعة"]],
  },
  {
    slug: "led-panel-60x60-40w", category: "electrical-lighting", icon: "LampCeiling",
    nameEn: "LED Panel Light 60×60 cm 40 W", nameAr: "لوح إنارة LED مقاس 60×60 سم بقدرة 40 واط",
    brand: "Wadi Select", price: 7_800, stock: 64, featured: true, warranty: 2,
    descEn: "Slim recessed panel for offices, shops and majlis ceilings, with flicker-free daylight output.",
    descAr: "لوح إنارة رفيع يُركّب داخل أسقف المكاتب والمحلات والمجالس، بإضاءة نهارية خالية من الوميض.",
    specs: [["Size", "المقاس", "60 × 60 cm", "60 × 60 سم"], ["Luminous flux", "شدة الإضاءة", "3,600 lm", "3600 لومن"]],
  },
  {
    slug: "extension-socket-4-way-3m", category: "electrical-lighting", icon: "PlugZap",
    nameEn: "4-Way Extension Socket, 3 m", nameAr: "مشترك كهربائي بأربعة مخارج وسلك 3 م",
    brand: "Qurum", price: 4_250, stock: 3, warranty: 1,
    descEn: "Surge-protected UK-type extension with individual switches and child-safe shutters.",
    descAr: "مشترك من النوع البريطاني بحماية من التيار الزائد، ومفتاح مستقل لكل مخرج، وأغطية أمان للأطفال.",
    specs: [["Outlets", "المخارج", "4 × UK 13 A", "4 × بريطاني 13 أمبير"], ["Cable length", "طول السلك", "3 m", "3 م"]],
  },
  {
    slug: "copper-cable-2-5mm-100m", category: "electrical-lighting", icon: "Cable",
    nameEn: "Copper Cable 2.5 mm² — 100 m Roll", nameAr: "كابل نحاسي 2.5 مم² — لفّة 100 م",
    brand: "Majan", price: 24_000, stock: 30, warranty: 0,
    descEn: "PVC-insulated single-core copper cable for socket circuits, made to IEC 60227.",
    descAr: "كابل نحاسي أحادي القلب معزول بمادة PVC لدوائر المقابس، مصنوع وفق المواصفة IEC 60227.",
    specs: [["Cross-section", "المقطع", "2.5 mm²", "2.5 مم²"], ["Length", "الطول", "100 m", "100 م"], ["Standard", "المواصفة", "IEC 60227", "IEC 60227"]],
  },
  {
    slug: "outdoor-led-floodlight-100w", category: "electrical-lighting", icon: "Flashlight",
    nameEn: "Outdoor LED Floodlight 100 W", nameAr: "كشّاف LED خارجي 100 واط",
    brand: "Falaj", price: 15_500, compareAt: 18_900, stock: 22, warranty: 2,
    descEn: "IP66 weatherproof floodlight for yards, car parks and building façades.",
    descAr: "كشّاف مقاوم للعوامل الجوية بمعيار IP66 لإنارة الأحواش ومواقف السيارات وواجهات المباني.",
    specs: [["Power", "القدرة", "100 W", "100 واط"], ["Protection", "درجة الحماية", "IP66", "IP66"]],
  },
  {
    slug: "solar-garden-lights-set-6", category: "electrical-lighting", icon: "SunMedium",
    nameEn: "Solar Garden Lights (Set of 6)", nameAr: "أضواء حديقة بالطاقة الشمسية (طقم 6)",
    brand: "Sahil", price: 11_900, stock: 0, warranty: 1,
    descEn: "Wire-free path lights that charge in the Omani sun and glow for up to ten hours.",
    descAr: "أضواء ممرات دون أسلاك تُشحن تحت شمس عُمان وتضيء حتى عشر ساعات.",
    specs: [["Pieces", "عدد القطع", "6", "6"], ["Run time", "مدة الإضاءة", "Up to 10 h", "حتى 10 ساعات"]],
  },
  {
    slug: "digital-multimeter", category: "electrical-lighting", icon: "Gauge",
    nameEn: "Digital Multimeter", nameAr: "جهاز قياس متعدد رقمي",
    brand: "Nizwa Pro", price: 8_750, stock: 25, warranty: 1,
    descEn: "Auto-ranging multimeter for voltage, current, resistance and continuity, with a backlit display.",
    descAr: "جهاز قياس بتحديد تلقائي للمدى لقياس الجهد والتيار والمقاومة والاستمرارية، مع شاشة مضاءة.",
    specs: [["Safety rating", "تصنيف الأمان", "CAT III 600 V", "CAT III 600 فولت"], ["Display", "الشاشة", "6,000 counts", "6000 عدّة"]],
  },

  // ── Tools & Hardware ──────────────────────────────────────────────
  {
    slug: "cordless-drill-driver-18v", category: "tools-hardware", icon: "Drill",
    nameEn: "Cordless Drill Driver 18 V", nameAr: "مثقاب ومفك لاسلكي 18 فولت",
    brand: "Nizwa Pro", price: 42_000, compareAt: 49_500, stock: 16, featured: true, warranty: 2,
    descEn: "Brushless drill driver with two 2.0 Ah batteries, a fast charger and a carry case.",
    descAr: "مثقاب بمحرك دون فُرَش مع بطاريتين بسعة 2.0 أمبير/ساعة وشاحن سريع وحقيبة حمل.",
    specs: [["Voltage", "الجهد", "18 V", "18 فولت"], ["Max. torque", "أقصى عزم", "55 Nm", "55 نيوتن·م"], ["Batteries", "البطاريات", "2 × 2.0 Ah", "2 × 2.0 أمبير/ساعة"]],
  },
  {
    slug: "tool-set-108-piece", category: "tools-hardware", icon: "Wrench",
    nameEn: "108-Piece Tool Set", nameAr: "طقم عِدّة 108 قطع",
    brand: "Wadi Select", price: 27_500, stock: 2, warranty: 1,
    descEn: "Chrome-vanadium sockets, spanners, screwdrivers and pliers in a sturdy moulded case.",
    descAr: "لُقَم ومفاتيح ربط ومفكات وكمّاشات من فولاذ الكروم فاناديوم في حقيبة متينة.",
    specs: [["Pieces", "عدد القطع", "108", "108"], ["Material", "المادة", "Chrome vanadium", "كروم فاناديوم"]],
  },
  {
    slug: "angle-grinder-850w", category: "tools-hardware", icon: "Torus",
    nameEn: "Angle Grinder 850 W", nameAr: "صاروخ تجليخ 850 واط",
    brand: "Nizwa Pro", price: 21_900, stock: 11, warranty: 1,
    descEn: "Compact 115 mm grinder with a side handle and spindle lock for cutting and grinding.",
    descAr: "صاروخ تجليخ صغير قطر 115 مم مع مقبض جانبي وقفل للمحور، مناسب للقص والتجليخ.",
    specs: [["Power", "القدرة", "850 W", "850 واط"], ["Disc diameter", "قطر القرص", "115 mm", "115 مم"]],
  },
  {
    slug: "aluminium-step-ladder-6", category: "tools-hardware", icon: "Construction",
    nameEn: "Aluminium Step Ladder, 6 Steps", nameAr: "سُلّم ألمنيوم بست درجات",
    brand: "Sahil", price: 18_500, stock: 9, warranty: 1,
    descEn: "Lightweight folding ladder with anti-slip treads and a 150 kg load rating.",
    descAr: "سُلّم خفيف قابل للطي بدرجات مانعة للانزلاق ويتحمّل حتى 150 كجم.",
    specs: [["Steps", "الدرجات", "6", "6"], ["Max. load", "الحمولة القصوى", "150 kg", "150 كجم"]],
  },
  {
    slug: "measuring-tape-8m", category: "tools-hardware", icon: "Ruler",
    nameEn: "Measuring Tape, 8 m", nameAr: "شريط قياس 8 م",
    brand: "Wadi Select", price: 2_400, stock: 90, warranty: 0,
    descEn: "Rubber-armoured tape with a 25 mm blade and metric and imperial markings.",
    descAr: "شريط قياس بغلاف مطاطي وشفرة بعرض 25 مم وتدريج متري وإنجليزي.",
    specs: [["Length", "الطول", "8 m", "8 م"], ["Blade width", "عرض الشريط", "25 mm", "25 مم"]],
  },
  {
    slug: "claw-hammer-16oz", category: "tools-hardware", icon: "Hammer",
    nameEn: "Claw Hammer, 16 oz", nameAr: "مطرقة بمخلب 16 أونصة",
    brand: "Wadi Select", price: 3_900, stock: 0, warranty: 0,
    descEn: "Forged steel head with a fibreglass handle that absorbs shock.",
    descAr: "رأس من الفولاذ المطروق ومقبض من الألياف الزجاجية يمتص الصدمات.",
    specs: [["Head weight", "وزن الرأس", "16 oz (450 g)", "16 أونصة (450 غ)"]],
  },
  {
    slug: "adjustable-spanner-set-3", category: "tools-hardware", icon: "Wrench",
    nameEn: "Adjustable Spanner Set (3 pcs)", nameAr: "طقم مفاتيح ربط قابلة للتعديل (3 قطع)",
    brand: "Nizwa Pro", price: 6_800, stock: 35, warranty: 1,
    descEn: "Six, eight and ten-inch spanners with laser-etched scales and a smooth worm gear.",
    descAr: "مفاتيح بمقاسات 6 و8 و10 بوصات مع تدريج محفور بالليزر وترس دودي سلس.",
    specs: [["Sizes", "المقاسات", "6\", 8\", 10\"", "6 و8 و10 بوصات"]],
  },

  // ── Building Materials ───────────────────────────────────────────
  {
    slug: "portland-cement-50kg", category: "building-materials", icon: "Package",
    nameEn: "Ordinary Portland Cement, 50 kg", nameAr: "إسمنت بورتلاندي عادي 50 كجم",
    brand: "Majan", price: 1_950, stock: 400, warranty: 0,
    descEn: "General-purpose OPC to BS EN 197-1 for concrete, blockwork and plastering.",
    descAr: "إسمنت بورتلاندي متعدد الاستخدامات وفق المواصفة BS EN 197-1 للخرسانة والبناء واللياسة.",
    specs: [["Weight", "الوزن", "50 kg", "50 كجم"], ["Strength class", "فئة المقاومة", "42.5 N", "42.5 N"]],
  },
  {
    slug: "interior-emulsion-paint-18l-white", category: "building-materials", icon: "PaintRoller",
    nameEn: "Interior Emulsion Paint 18 L — White", nameAr: "دهان مستحلب داخلي 18 لتر — أبيض",
    brand: "Sahil", price: 16_500, compareAt: 19_000, stock: 28, featured: true, warranty: 0,
    descEn: "Low-odour, washable matt emulsion covering up to 180 m² per tin.",
    descAr: "دهان مطفأ قابل للغسل منخفض الرائحة، تغطي العبوة الواحدة حتى 180 م².",
    specs: [["Volume", "الحجم", "18 litres", "18 لتراً"], ["Coverage", "التغطية", "Up to 180 m²", "حتى 180 م²"], ["Finish", "اللمسة النهائية", "Matt", "مطفأ"]],
  },
  {
    slug: "ceramic-floor-tiles-60x60", category: "building-materials", icon: "Grid3x3",
    nameEn: "Ceramic Floor Tiles 60×60 cm (per m²)", nameAr: "بلاط أرضيات سيراميك 60×60 سم (للمتر المربع)",
    brand: "Falaj", price: 4_600, stock: 260, warranty: 0,
    descEn: "Glazed porcelain-look tiles in warm sand beige, with an R10 anti-slip rating.",
    descAr: "بلاط مزجّج بمظهر البورسلين بلون رملي دافئ، بتصنيف R10 لمقاومة الانزلاق.",
    specs: [["Size", "المقاس", "60 × 60 cm", "60 × 60 سم"], ["Slip rating", "مقاومة الانزلاق", "R10", "R10"]],
  },
  {
    slug: "waterproofing-membrane-10m2", category: "building-materials", icon: "Layers",
    nameEn: "Waterproofing Membrane, 10 m² Roll", nameAr: "لفّة عزل مائي 10 م²",
    brand: "Majan", price: 19_800, stock: 5, warranty: 5,
    descEn: "Torch-applied bitumen membrane for roofs and wet areas, with a five-year warranty.",
    descAr: "غشاء بيتوميني يُثبّت بالحرارة للأسطح والمناطق الرطبة، مع ضمان خمس سنوات.",
    specs: [["Coverage", "التغطية", "10 m²", "10 م²"], ["Thickness", "السماكة", "4 mm", "4 مم"]],
  },
  {
    slug: "tile-adhesive-20kg", category: "building-materials", icon: "Package",
    nameEn: "Tile Adhesive, 20 kg", nameAr: "لاصق بلاط 20 كجم",
    brand: "Majan", price: 2_750, stock: 150, warranty: 0,
    descEn: "Polymer-modified cement adhesive for floor and wall tiles, indoors and out.",
    descAr: "لاصق إسمنتي معدّل بالبوليمر لبلاط الأرضيات والجدران، للاستخدام الداخلي والخارجي.",
    specs: [["Weight", "الوزن", "20 kg", "20 كجم"], ["Class", "الفئة", "C2TE", "C2TE"]],
  },
  {
    slug: "gypsum-board-12-5mm", category: "building-materials", icon: "Square",
    nameEn: "Gypsum Board 12.5 mm", nameAr: "لوح جبس 12.5 مم",
    brand: "Wadi Select", price: 2_900, stock: 0, warranty: 0,
    descEn: "Standard 1.2 × 2.4 m plasterboard for partitions and false ceilings.",
    descAr: "لوح جبس قياسي بمقاس 1.2 × 2.4 م للقواطع والأسقف المستعارة.",
    specs: [["Size", "المقاس", "1.2 × 2.4 m", "1.2 × 2.4 م"], ["Thickness", "السماكة", "12.5 mm", "12.5 مم"]],
  },
  {
    slug: "concrete-blocks-20cm-pallet", category: "building-materials", icon: "BrickWall",
    nameEn: "Concrete Blocks 20 cm (Pallet of 100)", nameAr: "طابوق خرساني 20 سم (طبلية 100 حبة)",
    brand: "Majan", price: 32_000, stock: 12, warranty: 0,
    descEn: "Hollow load-bearing blocks, delivered by truck to your site within Muscat.",
    descAr: "طابوق خرساني مجوّف حامل للأحمال، يُسلَّم بالشاحنة إلى موقعك داخل مسقط.",
    specs: [["Size", "المقاس", "40 × 20 × 20 cm", "40 × 20 × 20 سم"], ["Quantity", "الكمية", "100 blocks", "100 حبة"]],
  },

  // ── Plumbing & Sanitary ──────────────────────────────────────────
  {
    slug: "kitchen-sink-mixer-tap", category: "plumbing-sanitary", icon: "Droplets",
    nameEn: "Kitchen Sink Mixer Tap", nameAr: "خلاط مغسلة مطبخ",
    brand: "Falaj", price: 18_900, stock: 19, warranty: 3,
    descEn: "Brushed stainless-steel mixer with a pull-out spray head and ceramic cartridge.",
    descAr: "خلاط من الستانلس ستيل المصقول برأس رشّ قابل للسحب وخرطوشة سيراميك.",
    specs: [["Finish", "اللمسة النهائية", "Brushed steel", "ستانلس مصقول"], ["Cartridge", "الخرطوشة", "35 mm ceramic", "سيراميك 35 مم"]],
  },
  {
    slug: "rain-shower-set", category: "plumbing-sanitary", icon: "ShowerHead",
    nameEn: "Rain Shower Set with Hand Shower", nameAr: "طقم دُش مطري مع دُش يدوي",
    brand: "Falaj", price: 36_500, compareAt: 42_000, stock: 7, featured: true, warranty: 3,
    descEn: "Thermostatic shower column with a 25 cm rain head and three-mode hand shower.",
    descAr: "عمود دُش بمنظّم حرارة ورأس مطري قطره 25 سم ودُش يدوي بثلاثة أوضاع.",
    specs: [["Rain head", "الرأس المطري", "25 cm", "25 سم"], ["Valve", "الصمام", "Thermostatic", "منظّم حرارة"]],
  },
  {
    slug: "electric-water-heater-50l", category: "plumbing-sanitary", icon: "Heater",
    nameEn: "Electric Water Heater 50 L", nameAr: "سخان مياه كهربائي 50 لتر",
    brand: "Sahil", price: 54_000, stock: 4, warranty: 5,
    descEn: "Vertical heater with an enamel-lined tank, magnesium anode and safety thermostat.",
    descAr: "سخان عمودي بخزان مبطّن بالمينا وقضيب مغنيسيوم ومنظّم حرارة للأمان.",
    specs: [["Capacity", "السعة", "50 litres", "50 لتراً"], ["Power", "القدرة", "2,000 W", "2000 واط"]],
  },
  {
    slug: "ppr-pipe-25mm-4m", category: "plumbing-sanitary", icon: "Cylinder",
    nameEn: "PPR Pipe 25 mm — 4 m", nameAr: "أنبوب PPR قطر 25 مم — 4 م",
    brand: "Wadi Select", price: 1_650, stock: 300, warranty: 0,
    descEn: "PN20 polypropylene pipe for hot and cold water supply lines.",
    descAr: "أنبوب بولي بروبيلين بضغط PN20 لخطوط المياه الساخنة والباردة.",
    specs: [["Diameter", "القطر", "25 mm", "25 مم"], ["Pressure rating", "تصنيف الضغط", "PN20", "PN20"]],
  },
  {
    slug: "wall-hung-toilet-concealed-cistern", category: "plumbing-sanitary", icon: "Toilet",
    nameEn: "Wall-Hung Toilet with Concealed Cistern", nameAr: "مرحاض معلّق مع خزان مخفي",
    brand: "Falaj", price: 89_000, stock: 6, warranty: 5,
    descEn: "Rimless wall-hung pan with a soft-close seat and dual-flush concealed frame.",
    descAr: "مرحاض معلّق دون حافة مع مقعد بإغلاق هادئ وإطار مخفي بنظام دفق مزدوج.",
    specs: [["Flush", "الدفق", "3 / 6 litres", "3 / 6 لترات"], ["Seat", "المقعد", "Soft-close", "إغلاق هادئ"]],
  },
  {
    slug: "water-pump-0-5hp", category: "plumbing-sanitary", icon: "Waves",
    nameEn: "Water Pump 0.5 HP", nameAr: "مضخة مياه 0.5 حصان",
    brand: "Sahil", price: 29_500, stock: 10, warranty: 2,
    descEn: "Peripheral pump with a brass impeller to boost pressure from rooftop tanks.",
    descAr: "مضخة طرفية بمروحة نحاسية لرفع ضغط المياه من خزانات الأسطح.",
    specs: [["Power", "القدرة", "0.5 HP (370 W)", "0.5 حصان (370 واط)"], ["Max. head", "أقصى ارتفاع", "35 m", "35 م"]],
  },
  {
    slug: "washbasin-with-pedestal", category: "plumbing-sanitary", icon: "Bath",
    nameEn: "Washbasin with Pedestal", nameAr: "مغسلة بقاعدة",
    brand: "Falaj", price: 24_750, stock: 0, warranty: 5,
    descEn: "Vitreous china basin with a full pedestal that hides the waste pipework.",
    descAr: "مغسلة من الخزف الصيني مع قاعدة كاملة تُخفي أنابيب الصرف.",
    specs: [["Width", "العرض", "55 cm", "55 سم"], ["Material", "المادة", "Vitreous china", "خزف صيني"]],
  },

  // ── Kitchen & Household ──────────────────────────────────────────
  {
    slug: "non-stick-cookware-set-10", category: "kitchen-household", icon: "CookingPot",
    nameEn: "Non-Stick Cookware Set (10 pcs)", nameAr: "طقم أواني طهي غير لاصقة (10 قطع)",
    brand: "Dhofar Home", price: 34_500, compareAt: 39_900, stock: 21, featured: true, warranty: 1,
    descEn: "Granite-coated pots and pans with glass lids, suitable for all hobs including induction.",
    descAr: "قدور ومقالٍ بطلاء الجرانيت مع أغطية زجاجية، مناسبة لجميع المواقد بما فيها الحثّية.",
    specs: [["Pieces", "عدد القطع", "10", "10"], ["Hob types", "أنواع المواقد", "All, incl. induction", "الجميع بما فيها الحثّي"]],
  },
  {
    slug: "electric-kettle-1-7l", category: "kitchen-household", icon: "Milk",
    nameEn: "Electric Kettle 1.7 L", nameAr: "غلّاية كهربائية 1.7 لتر",
    brand: "Qurum", price: 7_900, stock: 48, warranty: 1,
    descEn: "Fast-boil stainless kettle with auto shut-off and boil-dry protection.",
    descAr: "غلّاية ستانلس سريعة الغليان مع إطفاء تلقائي وحماية من التشغيل دون ماء.",
    specs: [["Capacity", "السعة", "1.7 litres", "1.7 لتر"], ["Power", "القدرة", "2,200 W", "2200 واط"]],
  },
  {
    slug: "arabic-coffee-maker-dallah", category: "kitchen-household", icon: "Coffee",
    nameEn: "Arabic Coffee Maker (Electric Dallah)", nameAr: "صانعة القهوة العربية (دلّة كهربائية)",
    brand: "Dhofar Home", price: 22_000, stock: 13, featured: true, warranty: 1,
    descEn: "Brews traditional Omani kahwa with cardamom in minutes and keeps it warm for guests.",
    descAr: "تُحضّر القهوة العُمانية بالهيل خلال دقائق وتُبقيها دافئة لاستقبال الضيوف.",
    specs: [["Capacity", "السعة", "1 litre", "1 لتر"], ["Keep-warm", "خاصية الحفظ دافئاً", "Yes", "نعم"]],
  },
  {
    slug: "stainless-knife-set-6", category: "kitchen-household", icon: "UtensilsCrossed",
    nameEn: "Stainless Steel Knife Set (6 pcs)", nameAr: "طقم سكاكين ستانلس ستيل (6 قطع)",
    brand: "Wadi Select", price: 12_500, stock: 3, warranty: 1,
    descEn: "German-steel knives with ergonomic handles and a wooden storage block.",
    descAr: "سكاكين من الفولاذ الألماني بمقابض مريحة مع حامل خشبي للتخزين.",
    specs: [["Pieces", "عدد القطع", "6", "6"], ["Steel", "الفولاذ", "X50CrMoV15", "X50CrMoV15"]],
  },
  {
    slug: "blender-1-5l-600w", category: "kitchen-household", icon: "CupSoda",
    nameEn: "Blender 1.5 L, 600 W", nameAr: "خلّاط كهربائي 1.5 لتر بقدرة 600 واط",
    brand: "Qurum", price: 16_900, stock: 26, warranty: 1,
    descEn: "Glass-jar blender with an ice-crush setting and a dry grinder for spices.",
    descAr: "خلّاط بإبريق زجاجي مع وضع لتكسير الثلج ومطحنة جافة للبهارات.",
    specs: [["Jar", "الإبريق", "1.5 L glass", "زجاجي 1.5 لتر"], ["Power", "القدرة", "600 W", "600 واط"]],
  },
  {
    slug: "food-storage-containers-12", category: "kitchen-household", icon: "Container",
    nameEn: "Food Storage Containers (Set of 12)", nameAr: "حافظات طعام (طقم 12 قطعة)",
    brand: "Sahil", price: 6_400, stock: 70, warranty: 0,
    descEn: "BPA-free, stackable containers with airtight clip lids; microwave and freezer safe.",
    descAr: "حافظات خالية من BPA قابلة للتكديس بأغطية محكمة، آمنة للميكروويف والفريزر.",
    specs: [["Pieces", "عدد القطع", "12", "12"], ["Material", "المادة", "BPA-free PP", "بولي بروبيلين خالٍ من BPA"]],
  },
  {
    slug: "laundry-basket-with-lid", category: "kitchen-household", icon: "ShoppingBasket",
    nameEn: "Laundry Basket with Lid", nameAr: "سلّة غسيل بغطاء",
    brand: "Sahil", price: 3_750, stock: 44, warranty: 0,
    descEn: "Ventilated 60-litre basket with carry handles and a hinged lid.",
    descAr: "سلّة مهوّاة سعة 60 لتراً بمقابض للحمل وغطاء مفصلي.",
    specs: [["Capacity", "السعة", "60 litres", "60 لتراً"]],
  },
];

export const customers: { name: string; email: string; phone: string; gov: string; wilayat: string; area: string }[] = [
  { name: "Aisha Al Balushi", email: "customer@wadialghubaitah.test", phone: "+96891234567", gov: "muscat", wilayat: "Bawshar", area: "Al Khuwair" },
  { name: "Mohammed Al Harthy", email: "mohammed.harthy@example.test", phone: "+96892345678", gov: "muscat", wilayat: "Al Seeb", area: "Al Mawaleh" },
  { name: "Fatma Al Rawahi", email: "fatma.rawahi@example.test", phone: "+96893456789", gov: "dakhiliyah", wilayat: "Nizwa", area: "Firq" },
  { name: "Salim Al Kindi", email: "salim.kindi@example.test", phone: "+96894567890", gov: "batinah-north", wilayat: "Sohar", area: "Al Hambar" },
  { name: "Maryam Al Hinai", email: "maryam.hinai@example.test", phone: "+96895678901", gov: "dhofar", wilayat: "Salalah", area: "Al Saada" },
  { name: "Khalid Al Busaidi", email: "khalid.busaidi@example.test", phone: "+96896789012", gov: "muscat", wilayat: "Muttrah", area: "Ruwi" },
  { name: "Huda Al Maamari", email: "huda.maamari@example.test", phone: "+96897890123", gov: "sharqiyah-south", wilayat: "Sur", area: "Al Ayjah" },
  { name: "Yousuf Al Siyabi", email: "yousuf.siyabi@example.test", phone: "+96898901234", gov: "batinah-south", wilayat: "Barka", area: "Al Rumais" },
  { name: "Noor Al Zadjali", email: "noor.zadjali@example.test", phone: "+96899012345", gov: "muscat", wilayat: "Bawshar", area: "Al Ghubrah" },
  { name: "Saif Al Mukhaini", email: "saif.mukhaini@example.test", phone: "+96871234567", gov: "dhahirah", wilayat: "Ibri", area: "Al Araqi" },
  { name: "Zainab Al Lawati", email: "zainab.lawati@example.test", phone: "+96872345678", gov: "sharqiyah-north", wilayat: "Ibra", area: "Al Yahmadi" },
  { name: "Hamed Al Shukaili", email: "hamed.shukaili@example.test", phone: "+96873456789", gov: "buraimi", wilayat: "Al Buraimi", area: "Al Khadra" },
  { name: "Laila Al Amri", email: "laila.amri@example.test", phone: "+96874567890", gov: "musandam", wilayat: "Khasab", area: "Al Qadah" },
];

export const reviewTexts: { rating: number; titleEn: string; en: string }[] = [
  { rating: 5, titleEn: "Excellent quality", en: "Exactly as described and delivered to Muscat in two days. Very happy with it." },
  { rating: 5, titleEn: "Highly recommended", en: "Great value for money. The delivery driver called ahead and was very polite." },
  { rating: 4, titleEn: "Very good", en: "Works well and feels solid. Packaging could be a little better, but no damage." },
  { rating: 4, titleEn: "Good purchase", en: "Does the job nicely. Installation instructions were clear." },
  { rating: 5, titleEn: "Perfect for our home", en: "We bought this for our new house in Nizwa and it has been perfect." },
  { rating: 3, titleEn: "Decent", en: "Good product overall, although delivery took a day longer than expected." },
  { rating: 5, titleEn: "Great service", en: "Customer support helped me choose the right size. Thank you, Wadi Al Ghubaitah!" },
  { rating: 4, titleEn: "Solid and reliable", en: "Using it daily for a month now with no problems at all." },
  { rating: 2, titleEn: "Not quite right", en: "The product is fine but not what I expected for my needs. Returns process was easy though." },
];
