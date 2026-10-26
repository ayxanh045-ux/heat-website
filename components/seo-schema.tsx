export function SeoSchema() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
    "@id": "https://heatenergyanalytics.com/#organization",
    name: "HEAT — Hasanov Energy & Technology",
    alternateName: ["HEAT", "HEAT Energy Analytics", "HEAT Ağıllı Enerji Analitikası"],
    url: "https://heatenergyanalytics.com",
    logo: "https://heatenergyanalytics.com/app-icon-512.png",
    image: "https://heatenergyanalytics.com/og.png",
    description:
      "HEAT — Azərbaycanda restoran, hotel, istehsalat və biznes obyektləri üçün real vaxtda 3-fazalı elektrik enerjisi monitorinqi, süni intellekt analitikası və Telegram hesabatları təqdim edən EnergyTech platformasıdır.",
    email: "heat.co2026@gmail.com",
    telephone: "+994103314945",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Baku",
      addressRegion: "Baku",
      addressCountry: "AZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.409264,
      longitude: 49.867092,
    },
    areaServed: {
      "@type": "Country",
      name: "Azerbaijan",
    },
    priceRange: "69 AZN – 150 AZN",
    knowsAbout: [
      "Energy Monitoring",
      "Electricity Analytics",
      "Shelly Pro 3EM",
      "Commercial Energy Management",
      "Peak Load Optimization",
      "After-Hours Energy Waste Detection",
      "Telegram Energy Reporting",
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://heatenergyanalytics.com/#software",
    name: "HEAT Energy Analytics",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser, Cloud, Telegram Bot, PWA",
    offers: {
      "@type": "Offer",
      price: "69",
      priceCurrency: "AZN",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "69",
        priceCurrency: "AZN",
        unitText: "MONTH",
      },
      description: "Standart Variant: 150 AZN quraşdırma + hər ay 69 AZN (Aylıq ödənişlə). İllik Ödəniş Bonusu: «Əgər 1 illik abunəni birdəfəlik ödəsəniz, 2 ayı sizə hədiyyə edirik: 150 AZN + 690 AZN = Cəmi 840 AZN».",
    },
    description:
      "Bizneslərin elektrik enerjisi xərclərini real vaxtda izləyən, pik saatları, gecə itkilərini və faza balansını aşkar edən ağıllı analitika platforması.",
    featureList: [
      "Real-time 3-phase IoT electricity monitoring",
      "Automated daily, weekly, and monthly Telegram reports",
      "Gemini AI operational energy insights & advice",
      "After-hours baseline loss detection",
      "Peak demand threshold alerts",
      "Phase imbalance warning system",
      "Dedicated client dashboard & live web portal",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "HEAT nədir və bizneslərə necə kömək edir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HEAT — bizneslərin (restoran, hotel, mağaza, ofis, istehsalat) elektrik sərfiyyatını real vaxtda ölçən, israfı və pik yükləri aşkarlayan, süni intellekt və Telegram vasitəsilə 15–25%-dək qənaət imkanı yaradan ağıllı enerji monitorinqi platformasıdır.",
        },
      },
      {
        "@type": "Question",
        name: "Sistem hansı avadanlıqlarla işləyir və quraşdırma necə aparılır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HEAT sistemi sənaye standartı sayılan Shelly Pro 3EM və ya uyğun 3-fazalı IoT sensorları ilə təchiz olunur. Obyektin elektrik lövhəsinə kəsilməsiz və təhlükəsiz quraşdırılır, internet vasitəsilə mərkəzi bulud bazasına və analitika mərkəzinə qoşulur.",
        },
      },
      {
        "@type": "Question",
        name: "İş saatından sonrakı (gecə) enerji itkisi necə aşkarlanır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HEAT obyektin iş və qeyri-iş saatlarını təhlil edərək bağlanışdan sonra samovar, havalandırma, işıqlandırma və ya digər açıq qalmış cihazların yaratdığı xərci ayrıca hesablayır və Telegram botu vasitəsilə xəbərdarlıq göndərir.",
        },
      },
      {
        "@type": "Question",
        name: "Telegram hesabatları və AI analizi necə çatdırılır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Müştərilər gündəlik, həftəlik və aylıq olaraq Telegram botu üzərindən sərfiyyat, xərc və dəyişiklik faizlərini əks etdirən hesabatlar alır. Həmçinin Google Gemini AI mühərriki həmin məlumatları təhlil edərək biznes sahibinin başa düşəcəyi dildə konkret tədbir addımlarını izah edir.",
        },
      },
      {
        "@type": "Question",
        name: "HEAT xidmətinin qiyməti və abunəlik şərtləri necədir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Standart Variant: 150 AZN quraşdırma + hər ay 69 AZN (Aylıq ödənişlə). İllik Ödəniş Bonusu: «Əgər 1 illik abunəni birdəfəlik ödəsəniz, 2 ayı sizə hədiyyə edirik: 150 AZN + 690 AZN = Cəmi 840 AZN». Avadanlıq abunəlik boyu HEAT-in mülkiyyətində qalır və zəmanətlidir.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
