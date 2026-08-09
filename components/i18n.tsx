"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "az" | "ru";
type Pair = [string, string];
const copy: Record<string, Pair> = {
  Platform: ["Platforma", "Платформа"],
  Solutions: ["Həllər", "Решения"],
  "How It Works": ["Necə işləyir", "Как это работает"],
  Pricing: ["Qiymətlər", "Тарифы"],
  About: ["Haqqımızda", "О нас"],
  Contact: ["Əlaqə", "Контакты"],
  "Request Demo": ["Demo sifariş et", "Запросить демо"],
  "Intelligent Energy Analytics for Businesses": [
    "Bizneslər üçün ağıllı enerji analitikası",
    "Интеллектуальная энергоаналитика для бизнеса",
  ],
  "Stop Paying for Invisible": [
    "Görünməyən enerji israfına",
    "Перестаньте платить за невидимые",
  ],
  "Energy Waste.": ["pul ödəməyi dayandırın.", "потери энергии."],
  "HEAT gives businesses real-time visibility into electricity consumption, costs and hidden energy waste — all from one intelligent platform.":
    [
      "HEAT bizneslərə elektrik istehlakını, xərcləri və gizli enerji israfını vahid ağıllı platformada real vaxtda göstərir.",
      "HEAT в реальном времени показывает бизнесу потребление электроэнергии, расходы и скрытые потери — на одной интеллектуальной платформе.",
    ],
  "Request a Demo": ["Demo sifariş et", "Запросить демо"],
  "Explore Platform": ["Platformanı kəşf et", "Открыть платформу"],
  "Real-time monitoring": [
    "Real vaxt monitorinqi",
    "Мониторинг в реальном времени",
  ],
  "Cost intelligence": ["Xərc analitikası", "Аналитика затрат"],
  "Actionable alerts": ["Faydalı bildirişlər", "Полезные уведомления"],
  "LIVE PRODUCT PREVIEW": ["CANLI MƏHSUL İCMALI", "ДЕМО ПЛАТФОРМЫ"],
  "System online": ["Sistem aktivdir", "Система работает"],
  "Built for businesses where every kilowatt matters.": [
    "Hər kilovatın önəmli olduğu bizneslər üçün yaradılıb.",
    "Для бизнеса, где важен каждый киловатт.",
  ],
  Restaurants: ["Restoranlar", "Рестораны"],
  Hotels: ["Otellər", "Отели"],
  Retail: ["Pərakəndə satış", "Розница"],
  Offices: ["Ofislər", "Офисы"],
  "Business Centers": ["Biznes mərkəzləri", "Бизнес-центры"],
  Factories: ["Zavodlar", "Предприятия"],
  "Coffee Shops": ["Kafelər", "Кофейни"],
  "THE INVISIBLE PROBLEM": ["GÖRÜNMƏYƏN PROBLEM", "НЕВИДИМАЯ ПРОБЛЕМА"],
  "Your business closes.": ["Biznesiniz bağlanır.", "Ваш бизнес закрывается."],
  "Your electricity bill doesn’t.": [
    "Elektrik hesabınız isə yox.",
    "Счёт за электричество — нет.",
  ],
  "Air conditioning, lighting, kitchen equipment and refrigeration can keep consuming after working hours. Without continuous monitoring, that usage remains invisible.":
    [
      "Kondisioner, işıqlandırma, mətbəx və soyutma avadanlıqları iş saatlarından sonra da enerji sərf edə bilər. Davamlı monitorinq olmadan bu istehlak görünməz qalır.",
      "Кондиционеры, освещение, кухонное и холодильное оборудование могут потреблять энергию после закрытия. Без постоянного мониторинга это остаётся незаметным.",
    ],
  "After-Hours Consumption": [
    "İş saatlarından sonrakı istehlak",
    "Потребление после закрытия",
  ],
  "Equipment continues consuming electricity when your business is closed.": [
    "Biznes bağlı olduqda belə avadanlıq elektrik sərf etməyə davam edir.",
    "Оборудование продолжает потреблять электричество, когда бизнес закрыт.",
  ],
  "Unexpected Peaks": ["Gözlənilməz piklər", "Неожиданные пики"],
  "Sudden energy spikes can increase operating costs without being noticed.": [
    "Qəfil enerji sıçrayışları nəzərə çarpmadan xərcləri artıra bilər.",
    "Резкие скачки потребления могут незаметно увеличить расходы.",
  ],
  "No Real-Time Visibility": [
    "Real vaxt görünüşü yoxdur",
    "Нет данных в реальном времени",
  ],
  "Traditional electricity bills show what happened — not what is happening now.":
    [
      "Ənənəvi elektrik hesabı indi nə baş verdiyini deyil, keçmişi göstərir.",
      "Обычные счета показывают прошлое, а не то, что происходит сейчас.",
    ],
  "Hidden Operational Waste": [
    "Gizli əməliyyat israfı",
    "Скрытые операционные потери",
  ],
  "Small inefficiencies across many hours can accumulate into meaningful costs.":
    [
      "Saatlarla davam edən kiçik səmərəsizliklər böyük xərclərə çevrilə bilər.",
      "Небольшие потери за много часов складываются в значительные расходы.",
    ],
  "THE HEAT PLATFORM": ["HEAT PLATFORMASI", "ПЛАТФОРМА HEAT"],
  "One clear view of your energy.": [
    "Enerjinizə vahid və aydın baxış.",
    "Вся энергия — в одном понятном виде.",
  ],
  "Monitor, analyze and understand your business’s electricity consumption from a single intelligent workspace.":
    [
      "Biznesinizin elektrik istehlakını vahid ağıllı iş məkanından izləyin, təhlil edin və anlayın.",
      "Контролируйте и анализируйте энергопотребление бизнеса в едином интеллектуальном пространстве.",
    ],
  "See what others don’t.": [
    "Başqalarının görmədiyini görün.",
    "Увидьте то, чего не видят другие.",
  ],
  "HEAT continuously analyzes energy patterns and highlights unusual or unnecessary consumption.":
    [
      "HEAT enerji nümunələrini davamlı təhlil edir, qeyri-adi və lazımsız istehlakı göstərir.",
      "HEAT постоянно анализирует энергопотребление и выделяет необычные или лишние расходы.",
    ],
  "Waste Detection": ["İsrafın aşkarlanması", "Обнаружение потерь"],
  "Peak Analysis": ["Pik analizi", "Анализ пиков"],
  "Cost Intelligence": ["Xərc analitikası", "Аналитика затрат"],
  "After-Hours Monitoring": [
    "İş saatlarından sonra monitorinq",
    "Мониторинг после закрытия",
  ],
  "Smart Alerts": ["Ağıllı bildirişlər", "Умные уведомления"],
  "Energy Recommendations": [
    "Enerji tövsiyələri",
    "Энергетические рекомендации",
  ],
  "Identify unusual electricity usage and unnecessary consumption.": [
    "Qeyri-adi elektrik istifadəsini və lazımsız istehlakı müəyyən edin.",
    "Выявляйте необычное и ненужное потребление.",
  ],
  "Understand when your business consumes the most energy.": [
    "Biznesinizin ən çox enerjini nə vaxt sərf etdiyini anlayın.",
    "Поймите, когда бизнес потребляет больше всего энергии.",
  ],
  "Translate electricity usage into understandable financial impact.": [
    "Elektrik istifadəsini anlaşılan maliyyə təsirinə çevirin.",
    "Переводите расход электричества в понятные финансовые показатели.",
  ],
  "Detect electricity consumption outside working hours.": [
    "İş saatları xaricində elektrik istehlakını aşkarlayın.",
    "Обнаруживайте потребление вне рабочих часов.",
  ],
  "Receive notifications when unusual activity is detected.": [
    "Qeyri-adi fəaliyyət aşkarlandıqda bildiriş alın.",
    "Получайте уведомления о необычной активности.",
  ],
  "Turn consumption data into actionable operational insights.": [
    "İstehlak məlumatını praktik tövsiyələrə çevirin.",
    "Превращайте данные в практические рекомендации.",
  ],
  "Analysis Complete": ["Təhlil tamamlandı", "Анализ завершён"],
  "POSSIBLE ENERGY WASTE DETECTED": [
    "MÜMKÜN ENERJİ İSRAFI AŞKARLANDI",
    "ОБНАРУЖЕНЫ ВОЗМОЖНЫЕ ПОТЕРИ",
  ],
  "After-hours baseline exceeded": [
    "İş saatlarından sonrakı baza həddi aşılıb",
    "Превышен базовый уровень после закрытия",
  ],
  "Possible causes": ["Mümkün səbəblər", "Возможные причины"],
  "HVAC running after closing": [
    "Kondisioner sistemi bağlanışdan sonra işləyir",
    "Кондиционер работает после закрытия",
  ],
  "Kitchen equipment left active": [
    "Mətbəx avadanlığı aktiv qalıb",
    "Кухонное оборудование не выключено",
  ],
  "Lighting load": ["İşıqlandırma yükü", "Нагрузка освещения"],
  "Unnecessary consumption": ["Lazımsız istehlak", "Лишнее потребление"],
  "Estimated cost impact": [
    "Təxmini xərc təsiri",
    "Расчётное влияние на расходы",
  ],
  "View Analysis": ["Təhlilə bax", "Посмотреть анализ"],
  "Energy Waste Detected": [
    "Enerji israfı aşkarlandı",
    "Обнаружены потери энергии",
  ],
  "View Details": ["Detallara bax", "Подробнее"],
  Dismiss: ["Bağla", "Закрыть"],
  "HOW HEAT WORKS": ["HEAT NECƏ İŞLƏYİR", "КАК РАБОТАЕТ HEAT"],
  "From electricity panel to actionable insight.": [
    "Elektrik panelindən praktik qərara qədər.",
    "От электрощита до понятного решения.",
  ],
  Measure: ["Ölç", "Измерение"],
  Connect: ["Qoşul", "Подключение"],
  Analyze: ["Təhlil et", "Анализ"],
  Alert: ["Xəbərdar et", "Уведомление"],
  Optimize: ["Optimallaşdır", "Оптимизация"],
  "Monitoring hardware collects electricity data.": [
    "Monitorinq avadanlığı elektrik məlumatlarını toplayır.",
    "Оборудование собирает данные об электричестве.",
  ],
  "Information is securely sent to HEAT.": [
    "Məlumat HEAT-ə təhlükəsiz ötürülür.",
    "Данные безопасно передаются в HEAT.",
  ],
  "Patterns, costs and anomalies are evaluated.": [
    "Nümunələr, xərclər və anomaliyalar qiymətləndirilir.",
    "Оцениваются модели, расходы и аномалии.",
  ],
  "Important notifications reach the owner.": [
    "Vacib bildirişlər sahibkara çatır.",
    "Владелец получает важные уведомления.",
  ],
  "Data supports better energy decisions.": [
    "Məlumat daha yaxşı enerji qərarlarını dəstəkləyir.",
    "Данные помогают принимать лучшие решения.",
  ],
  "BETTER DECISIONS": ["DAHA YAXŞI QƏRARLAR", "ЛУЧШИЕ РЕШЕНИЯ"],
  "Energy visibility that changes the conversation.": [
    "Qərarları dəyişən enerji görünüşü.",
    "Прозрачность энергии, меняющая решения.",
  ],
  "24/7 Monitoring": ["24/7 Monitorinq", "Мониторинг 24/7"],
  "Real-Time Visibility": ["Real vaxt görünüşü", "Данные в реальном времени"],
  "Multi-Location Management": [
    "Çoxsaylı məkanların idarəsi",
    "Управление несколькими объектами",
  ],
  "Actionable Analytics": ["Praktik analitika", "Практическая аналитика"],
  "Where does your electricity go after closing?": [
    "Bağlanışdan sonra elektrik hara sərf olunur?",
    "Куда уходит электричество после закрытия?",
  ],
  "Business hours": ["İş saatları", "Рабочие часы"],
  "Potential Waste Zone": ["Mümkün israf zonası", "Зона возможных потерь"],
  INDUSTRIES: ["SAHƏLƏR", "ОТРАСЛИ"],
  "Built for energy-intensive businesses.": [
    "Enerji tutumlu bizneslər üçün yaradılıb.",
    "Создано для энергоёмкого бизнеса.",
  ],
  "MULTI-LOCATION": ["ÇOXŞAXƏLİ İDARƏETMƏ", "НЕСКОЛЬКО ОБЪЕКТОВ"],
  "Every location. One live view.": [
    "Bütün məkanlar. Bir canlı görünüş.",
    "Все объекты. Один экран.",
  ],
  "Discuss your portfolio": [
    "Obyektlərinizi müzakirə edək",
    "Обсудить ваши объекты",
  ],
  "Location Overview": ["Məkan icmalı", "Обзор объектов"],
  "Total Live Consumption": [
    "Ümumi canlı istehlak",
    "Общее текущее потребление",
  ],
  Normal: ["Normal", "Норма"],
  Warning: ["Xəbərdarlıq", "Внимание"],
  "Baku, Azerbaijan": ["Bakı, Azərbaycan", "Баку, Азербайджан"],
  "HEAT Daily Energy Report": [
    "HEAT Gündəlik Enerji Hesabatı",
    "Ежедневный отчёт HEAT",
  ],
  "Today’s Usage": ["Bugünkü istehlak", "Расход сегодня"],
  "Estimated Cost": ["Təxmini xərc", "Расчётная стоимость"],
  "Peak Power": ["Pik güc", "Пиковая мощность"],
  "Peak Time": ["Pik vaxtı", "Время пика"],
  "After-Hours Usage": [
    "İş saatlarından sonrakı istehlak",
    "Расход после закрытия",
  ],
  RECOMMENDATION: ["TÖVSİYƏ", "РЕКОМЕНДАЦИЯ"],
  "View Full Report": ["Tam hesabata bax", "Открыть полный отчёт"],
  "Request a sample report": ["Nümunə hesabat istə", "Запросить пример отчёта"],
  "FLEXIBLE PLANS": ["ÇEVİK PLANLAR", "ГИБКИЕ ТАРИФЫ"],
  "Built around your operation.": [
    "Biznesinizə uyğun qurulur.",
    "Подстроено под ваш бизнес.",
  ],
  Monitoring: ["Monitorinq", "Мониторинг"],
  Enterprise: ["Korporativ", "Корпоративный"],
  RECOMMENDED: ["TÖVSİYƏ OLUNUR", "РЕКОМЕНДУЕМ"],
  "Contact for Pricing": ["Qiymət üçün əlaqə saxlayın", "Узнать стоимость"],
  "Request Quote": ["Təklif istə", "Запросить предложение"],
  "Contact HEAT": ["HEAT ilə əlaqə", "Связаться с HEAT"],
  "THE HEAT DIFFERENCE": ["HEAT FƏRQİ", "ПРЕИМУЩЕСТВО HEAT"],
  "Electricity data is only useful when you can understand it.": [
    "Elektrik məlumatı yalnız onu anlaya bildikdə faydalıdır.",
    "Данные об электричестве полезны, только когда они понятны.",
  ],
  "Traditional Electricity Bill": [
    "Ənənəvi elektrik hesabı",
    "Обычный счёт за электричество",
  ],
  "With HEAT": ["HEAT ilə", "С HEAT"],
  "ABOUT HEAT": ["HEAT HAQQINDA", "О HEAT"],
  "Building smarter energy management for businesses.": [
    "Bizneslər üçün daha ağıllı enerji idarəetməsi qururuq.",
    "Создаём умное управление энергией для бизнеса.",
  ],
  Visibility: ["Görünüş", "Прозрачность"],
  Efficiency: ["Səmərəlilik", "Эффективность"],
  Technology: ["Texnologiya", "Технологии"],
  "START SEEING ENERGY DIFFERENTLY": [
    "ENERJİYƏ FƏRQLİ BAXIN",
    "ПОСМОТРИТЕ НА ЭНЕРГИЮ ИНАЧЕ",
  ],
  "You can’t optimize": ["Görmədiyinizi", "Нельзя оптимизировать то,"],
  "what you can’t see.": ["optimallaşdıra bilməzsiniz.", "чего вы не видите."],
  "Request a Free Demo": [
    "Pulsuz demo sifariş et",
    "Запросить бесплатное демо",
  ],
  CONTACT: ["ƏLAQƏ", "КОНТАКТЫ"],
  "Let’s talk about your energy usage.": [
    "Enerji istifadəniz haqqında danışaq.",
    "Обсудим ваше энергопотребление.",
  ],
  "Full Name": ["Ad və soyad", "Имя и фамилия"],
  "Your name": ["Adınız", "Ваше имя"],
  "Company Name": ["Şirkət adı", "Название компании"],
  "Business Type": ["Biznes növü", "Тип бизнеса"],
  "Select type": ["Növü seçin", "Выберите тип"],
  "Phone Number": ["Telefon nömrəsi", "Номер телефона"],
  "Number of Locations": ["Məkan sayı", "Количество объектов"],
  "Average Monthly Electricity Cost": [
    "Orta aylıq elektrik xərci",
    "Средние расходы на электричество в месяц",
  ],
  Message: ["Mesaj", "Сообщение"],
  "Request Energy Assessment": [
    "Enerji qiymətləndirməsi istə",
    "Запросить энергооценку",
  ],
  "Request received.": ["Sorğu qəbul edildi.", "Заявка получена."],
  "Send another request": ["Yeni sorğu göndər", "Отправить ещё одну заявку"],
  Email: ["E-poçt", "Эл. почта"],
  Phone: ["Telefon", "Телефон"],
  Location: ["Ünvan", "Адрес"],
  Product: ["Məhsul", "Продукт"],
  Company: ["Şirkət", "Компания"],
  Privacy: ["Məxfilik", "Конфиденциальность"],
  Legal: ["Hüquqi", "Правовая информация"],
  "Energy Analytics": ["Enerji Analitikası", "Энергоаналитика"],
  "Demo Data": ["Demo Məlumat", "Демо-данные"],
  "Real-Time Power": ["Real vaxt gücü", "Текущая мощность"],
  "Today’s Energy": ["Bugünkü enerji", "Энергия сегодня"],
  "Today's Energy": ["Bugünkü enerji", "Энергия сегодня"],
  "Today’s Cost": ["Bugünkü xərc", "Расходы сегодня"],
  "Today's Cost": ["Bugünkü xərc", "Расходы сегодня"],
  "Power Factor": ["Güc əmsalı", "Коэффициент мощности"],
  Voltage: ["Gərginlik", "Напряжение"],
  "Today’s Consumption": ["Bugünkü istehlak", "Потребление сегодня"],
  "Today's Consumption": ["Bugünkü istehlak", "Потребление сегодня"],
  Overview: ["İcmal", "Обзор"],
  "Live Energy": ["Canlı enerji", "Энергия онлайн"],
  Reports: ["Hesabatlar", "Отчёты"],
  Locations: ["Məkanlar", "Объекты"],
  Devices: ["Cihazlar", "Устройства"],
  Settings: ["Ayarlar", "Настройки"],
  "Energy Overview": ["Enerji icmalı", "Обзор энергии"],
  Today: ["Bu gün", "Сегодня"],
  "Monthly Usage": ["Aylıq istifadə", "Расход за месяц"],
  "Monthly Estimate": ["Aylıq təxmin", "Прогноз на месяц"],
  "Energy Consumption": ["Enerji istehlakı", "Энергопотребление"],
  Week: ["Həftə", "Неделя"],
  Month: ["Ay", "Месяц"],
  "Energy Cost": ["Enerji xərci", "Стоимость энергии"],
  "This Month": ["Bu ay", "Этот месяц"],
  Projected: ["Proqnoz", "Прогноз"],
  "Sending…": ["Göndərilir…", "Отправка…"],
  "Your request could not be sent. Please try again or email us directly.": [
    "Sorğu göndərilmədi. Yenidən cəhd edin və ya bizə birbaşa e-poçt yazın.",
    "Не удалось отправить заявку. Повторите попытку или напишите нам напрямую.",
  ],
};

const reverse = new Map<string, string>();
Object.entries(copy).forEach(([en, [a, r]]) => {
  reverse.set(a, en);
  reverse.set(r, en);
});
const C = createContext<{
  language: Language;
  setLanguage: (x: Language) => void;
}>({ language: "en", setLanguage: () => {} });
function tx(value: string, language: Language) {
  const l = value.match(/^\s*/)?.[0] ?? "",
    r = value.match(/\s*$/)?.[0] ?? "",
    raw = value.trim();
  if (!raw) return value;
  const en = reverse.get(raw) ?? raw;
  return (
    l +
    (language === "en" ? en : (copy[en]?.[language === "az" ? 0 : 1] ?? en)) +
    r
  );
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("en");
  useEffect(() => {
    const x = localStorage.getItem("heat-language") as Language;
    if (["en", "az", "ru"].includes(x)) setLang(x);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    const root = document.getElementById("heat-site");
    if (!root) return;
    const run = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue)
        node.nodeValue = tx(node.nodeValue, language);
      if (node instanceof HTMLElement) {
        ["placeholder", "aria-label"].forEach((a) => {
          const v = node.getAttribute(a);
          if (v) node.setAttribute(a, tx(v, language));
        });
      }
      node.childNodes.forEach(run);
    };
    run(root);
    const o = new MutationObserver((rs) =>
      rs.forEach((x) => x.addedNodes.forEach(run)),
    );
    o.observe(root, { childList: true, subtree: true });
    return () => o.disconnect();
  }, [language]);
  const setLanguage = (x: Language) => {
    localStorage.setItem("heat-language", x);
    setLang(x);
  };
  return (
    <C.Provider value={useMemo(() => ({ language, setLanguage }), [language])}>
      {children}
    </C.Provider>
  );
}
export const useLanguage = () => useContext(C);
