"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card, Reveal, SectionHeader } from "./ui";
import { useLanguage } from "./i18n";

type FaqItem = {
  question: { az: string; en: string; ru: string };
  answer: { az: string; en: string; ru: string };
};

const faqs: FaqItem[] = [
  {
    question: {
      az: "HEAT nədir və biznesimə necə kömək edir?",
      en: "What is HEAT and how does it help my business?",
      ru: "Что такое HEAT и чем он полезен бизнесу?",
    },
    answer: {
      az: "HEAT — restoran, hotel, istehsalat və ticarət obyektləri üçün real vaxtda 3-fazalı elektrik enerjisini ölçən, israfı və pik yükləri aşkarlayan, süni intellekt və Telegram vasitəsilə 15–25%-dək qənaət təmin edən ağıllı EnergyTech platformasıdır.",
      en: "HEAT is an intelligent EnergyTech platform that measures 3-phase electricity consumption in real time for restaurants, hotels, factories, and commercial sites, uncovering hidden waste and peak loads to deliver 15–25% cost savings via AI and Telegram.",
      ru: "HEAT — это интеллектуальная EnergyTech-платформа, которая в реальном времени измеряет 3-фазное потребление электроэнергии для ресторанов, отелей, производств и магазинов, выявляя скрытые потери и пиковые нагрузки для экономии 15–25% с помощью ИИ и Telegram.",
    },
  },
  {
    question: {
      az: "Quraşdırma necə aparılır və biznesin işini dayandırmaq lazımdırmı?",
      en: "How is the system installed and does it require downtime?",
      ru: "Как происходит установка и требуется ли остановка работы?",
    },
    answer: {
      az: "Quraşdırma cəmi 30–45 dəqiqə çəkir və obyektin fəaliyyətini dayandırmadan, təhlükəsiz şəkildə Shelly Pro 3EM sensorları ilə elektrik paylayıcı lövhəsinə inteqrasiya olunur.",
      en: "Installation takes only 30–45 minutes and is performed safely on your electrical panel using Shelly Pro 3EM sensors without disrupting your business operations.",
      ru: "Установка занимает всего 30–45 минут и выполняется безопасно на электрощите с помощью датчиков Shelly Pro 3EM без остановки работы вашего бизнеса.",
    },
  },
  {
    question: {
      az: "İş saatından sonrakı (gecə) enerji itkisi necə aşkarlanır?",
      en: "How is after-hours energy waste detected?",
      ru: "Как выявляются ночные потери электроэнергии?",
    },
    answer: {
      az: "Sistem obyektin bağlanış saatından sonra işləyən xətləri (işıqlandırma, samovar, kondisioner, soyuducu baza yükü) fasiləsiz izləyir və normadan artıq sərfiyyat aşkarlandıqda dərhal Telegram-da xəbərdarlıq göndərir.",
      en: "The system monitors all lines (lighting, samovars, HVAC, refrigeration baseline) after closing hours and instantly alerts you via Telegram if abnormal consumption is detected.",
      ru: "Система отслеживает все линии (освещение, самовары, кондиционеры, базовую нагрузку холодильников) после закрытия и мгновенно отправляет оповещение в Telegram при обнаружении лишнего расхода.",
    },
  },
  {
    question: {
      az: "Telegram hesabatları və AI analizi necə işləyir?",
      en: "How do Telegram reports and AI analysis work?",
      ru: "Как работают отчёты в Telegram и ИИ-анализ?",
    },
    answer: {
      az: "Hər gün və həftəlik olaraq Telegram botu sərfiyyatı və pul xərcini (AZN) göndərir. Google Gemini AI mühərriki isə xərclərin səbəbini və görüləcək konkret addımları sadə dildə izah edir.",
      en: "The Telegram bot delivers daily and weekly consumption and cost figures (AZN). The Google Gemini AI engine explains root causes and specific actionable steps in clear business terms.",
      ru: "Telegram-бот отправляет ежедневные и еженедельные показатели расхода и затрат (AZN). Модуль Google Gemini AI на простом языке объясняет причины и конкретные действия для экономии.",
    },
  },
  {
    question: {
      az: "HEAT xidmətinin qiyməti və abunəlik şərtləri necədir?",
      en: "What is the pricing and subscription model?",
      ru: "Каковы цены и условия подписки?",
    },
    answer: {
      az: "Standart Variant: 150 AZN quraşdırma + hər ay 69 AZN (Aylıq ödənişlə). İllik Ödəniş Bonusu: «Əgər 1 illik abunəni birdəfəlik ödəsəniz, 2 ayı sizə hədiyyə edirik: 150 AZN + 690 AZN = Cəmi 840 AZN». Monitorinq avadanlığı abunəlik müddətində HEAT-in mülkiyyətində qalır və tam zəmanətlidir.",
      en: "Standard Option: 150 AZN installation + 69 AZN/month (monthly payment). Annual Payment Bonus: Pay 1 year upfront and get 2 months free: 150 AZN + 690 AZN = 840 AZN total. Monitoring hardware remains HEAT property during the subscription with full warranty.",
      ru: "Стандартный вариант: 150 AZN установка + 69 AZN/месяц (ежемесячная оплата). Бонус при годовой оплате: при единовременной оплате за 1 год — 2 месяца в подарок: 150 AZN + 690 AZN = всего 840 AZN. Оборудование остаётся в собственности HEAT с полной гарантией.",
    },
  },
];

export function FaqSection() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const titles = {
    eyebrow: {
      az: "SUALLAR VƏ CAVABLAR",
      en: "QUESTIONS & ANSWERS",
      ru: "ВОПРОСЫ И ОТВЕТЫ",
    },
    title: {
      az: "Enerji monitorinqi haqqında tez-tez verilən suallar.",
      en: "Frequently asked questions about energy monitoring.",
      ru: "Часто задаваемые вопросы об энергомониторинге.",
    },
    body: {
      az: "HEAT platformasının quraşdırılması, iş prinsipi, AI analitikası və qənaət imkanları ilə bağlı ən vacib məlumatlar.",
      en: "Key details on installation, technology, AI analytics, and cost savings with the HEAT energy platform.",
      ru: "Вся важная информация об установке, технологии, аналитике ИИ и экономии с платформой HEAT.",
    },
  };

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="faq section" id="faq">
      <div className="container">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow={titles.eyebrow[language] || titles.eyebrow.en}
            title={titles.title[language] || titles.title.en}
            body={titles.body[language] || titles.body.en}
          />
        </Reveal>
        <div className="faq-grid" style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const q = faq.question[language] || faq.question.en;
            const a = faq.answer[language] || faq.answer.en;
            return (
              <Reveal key={faq.question.en} delay={index * 0.05}>
                <Card
                  className={`faq-card ${isOpen ? "open" : ""}`}
                  style={{
                    cursor: "pointer",
                    padding: "1.25rem 1.5rem",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onClick={() => toggle(index)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                      }}
                    >
                      <HelpCircle size={18} style={{ opacity: 0.7, flexShrink: 0 }} />
                      {q}
                    </h3>
                    <span
                      style={{
                        display: "inline-flex",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <ChevronDown size={18} />
                    </span>
                  </div>
                  {isOpen && (
                    <p
                      style={{
                        margin: "1rem 0 0 0",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        lineHeight: 1.6,
                        opacity: 0.9,
                      }}
                    >
                      {a}
                    </p>
                  )}
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
