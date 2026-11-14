export interface RegionalDeity {
  id: string;
  slug: string;
  nameEn: string;
  nameGu: string;
  dham: string;
  mantra: string;
  description: string;
  imageUrl: string;
  availableFormats: Array<"acrylic" | "frame" | "translight" | "bitu">;
  sizes: {
    acrylic: string[];
    frame: string[];
    translight: string[];
    bitu: string[];
  };
  startingPrice: number;
}

export const REGIONAL_DEITIES: RegionalDeity[] = [
  {
    id: "dwarkadhish",
    slug: "dwarkadhish",
    nameEn: "Bhagwan Shri Dwarkadhish (Ranchhodrai)",
    nameGu: "શ્રી દ્વારકાધીશ રાજાધિરાજ (રણછોડરાય)",
    dham: "જગત મંદિર · દ્વારકા ધામ",
    mantra: "ૐ ક્લીં કૃષ્ણાય નમઃ · જય દ્વારકાધીશ",
    description:
      "Revered King of Dwarka with jewel-studded Swaroop, sacred Shankha, Chakra, Gada and holy tulsi shringar. Beautifully illuminated for home mandir and living room sanctum.",
    imageUrl: "/deities/shrinathji.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "jalaram-bapa",
    slug: "jalaram-bapa",
    nameEn: "Pujya Jalaram Bapa (Virpur Dham)",
    nameGu: "પરમ પૂજ્ય સંત શ્રી જલારામ બાપા",
    dham: "વીરપુર ધામ (જેતપુર સમીપ - 12 કિમી)",
    mantra: "જય જલારામ · સબસે બડી સેવા",
    description:
      "Beloved Saint of Virpur (just 12 km from Jetpur) known for eternal sadavrat (annadaan), compassion, and selfless devotion. Handcrafted keepsake for home sanctums.",
    imageUrl: "/deities/shrinathji.jpg",
    availableFormats: ["acrylic", "frame", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 650,
  },
  {
    id: "khodiyar-maa",
    slug: "khodiyar-maa",
    nameEn: "Aai Shri Khodiyar Maa",
    nameGu: "આઈ શ્રી ખોડિયાર માં",
    dham: "માટેલ / રાજપરા / ગળધરા ધામ (સૌરાષ્ટ્ર)",
    mantra: "જય આઈ ખોડિયાર માં · માઁ ખોડલ કૃપા",
    description:
      "Sacred Kuldevi of Saurashtra with crocodile vahana and holy trishul, bestowing eternal protection, family prosperity and maternal grace.",
    imageUrl: "/deities/khodiyar-mataji.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "umiya-mataji",
    slug: "umiya-mataji",
    nameEn: "Jagat Janani Maa Umiya",
    nameGu: "જગત જનની માં ઉમિયા (ઉંઝા ધામ)",
    dham: "ઊંઝા લક્ષચંડી ધામ (ગુજરાત)",
    mantra: "જય માં ઉમિયા · કુળદેવી સદા સહાયતે",
    description:
      "Sacred Kuldevi of Patidar families and thousands of Gujarati households, offering divine maternal blessings, health, and auspicious prosperity.",
    imageUrl: "/deities/umiya-mataji.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "somnath",
    slug: "somnath",
    nameEn: "Aadi Jyotirlinga Somnath Mahadev",
    nameGu: "પ્રથમ જ્યોતિર્લિંગ શ્રી સોમનાથ મહાદેવ",
    dham: "પ્રભાસ પાટણ · સૌરાષ્ટ્ર તીર્થ",
    mantra: "ૐ નમઃ શિવાય · હર હર મહાદેવ",
    description:
      "First among the twelve Jyotirlingas, overlooking the Arabian Sea in Saurashtra with sacred serpent and bilva shringar in silver sheen.",
    imageUrl: "/deities/shiva-parvati.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "kashtabhanjan-hanuman",
    slug: "kashtabhanjan-hanuman",
    nameEn: "Shree Kashtabhanjan Dev Hanumanji",
    nameGu: "શ્રી કષ્ટભંજન દેવ હનુમાનજી મહારાજ",
    dham: "સાળંગપુર ધામ (બોટાદ, ગુજરાત)",
    mantra: "જય શ્રી કષ્ટભંજન દેવ · સાળંગપુર હનુમાન",
    description:
      "Dispeller of all obstacles, hardships and distress. The miraculous golden Swaroop of Hanumanji Maharaj at Sarangpur.",
    imageUrl: "/deities/ram-darbar.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "swaminarayan",
    slug: "swaminarayan",
    nameEn: "Bhagwan Shree Swaminarayan",
    nameGu: "ભગવાન શ્રી સ્વામિનારાયણ",
    dham: "ગઢડા / જેતપુર અક્ષર ભુવન / વડતાલ",
    mantra: "ૐ શ્રી સ્વામિનારાયણાય નમઃ",
    description:
      "Spiritual sanctuary of divine peace, Akshar Purushottam darshan, and holy presence revered across Gujarat and worldwide.",
    imageUrl: "/deities/shrinathji.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "ganesha",
    slug: "ganesha",
    nameEn: "Shree Siddhivinayak Ganesha",
    nameGu: "પ્રથમ પૂજ્ય શ્રી સિદ્ધિ વિનાયક ગણેશ",
    dham: "પ્રથમ પૂજ્ય · સિદ્ધિ ક્ષેત્ર",
    mantra: "ૐ ગં ગણપતયે નમઃ · શુભ લાભ",
    description:
      "Auspicious beginnings, obstacle removal, and divine prosperity for your home mandir, office, and business sanctum.",
    imageUrl: "/deities/ganesha.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "radha-krishna",
    slug: "radha-krishna",
    nameEn: "Shree Radha Krishna Jugal Jodi",
    nameGu: "શ્રી રાધા-કૃષ્ણ જુગલ જોડી",
    dham: "વૃંદાવન / ગોકુલ / દ્વારકા",
    mantra: "રાધે રાધે · શ્રી કૃષ્ણઃ શરણં મમ",
    description:
      "Ethereal divine love, peace, and spiritual harmony for home sanctums, puja altars, and wedding gift keepsakes.",
    imageUrl: "/deities/radha-krishna.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
  {
    id: "shiva-parvati",
    slug: "shiva-parvati",
    nameEn: "Kailash Pati Shiva Parvati Parivar",
    nameGu: "શ્રી શિવ-પાર્વતી-ગણેશ પરિવાર",
    dham: "કૈલાશ માનસરોવર / સોમનાથ",
    mantra: "ૐ ઉમામહેશ્વરાભ્યાં નમઃ",
    description:
      "Complete divine family portrait representing familial unity, longevity, tranquility, and auspicious blessings.",
    imageUrl: "/deities/shiva-parvati.jpg",
    availableFormats: ["acrylic", "frame", "translight", "bitu"],
    sizes: {
      acrylic: ["8×12 in", "12×18 in"],
      frame: ["10×14 in", "12×18 in", "16×24 in"],
      translight: ["12×18 in", "16×24 in"],
      bitu: ["10×14 in", "12×18 in"],
    },
    startingPrice: 750,
  },
];
