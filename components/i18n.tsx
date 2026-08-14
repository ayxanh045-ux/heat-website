"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
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
  "HEAT SUBSCRIPTION": ["HEAT ABUNƏLİYİ", "ПОДПИСКА HEAT"],
  "Clear pricing. Complete energy visibility.": [
    "Aydın qiymət. Enerjiyə tam nəzarət.",
    "Понятная цена. Полная картина энергопотребления.",
  ],
  "Everything required to monitor one facility, understand electricity costs and receive useful alerts is included in one service package.": [
    "Bir obyektin monitorinqi, elektrik xərclərinin anlaşılması və faydalı bildirişlərin alınması üçün lazım olan hər şey vahid xidmət paketinə daxildir.",
    "В один пакет включено всё необходимое для мониторинга одного объекта, анализа расходов на электричество и получения полезных уведомлений.",
  ],
  "COMPLETE PACKAGE": ["TAM PAKET", "ПОЛНЫЙ ПАКЕТ"],
  "FIRST MONTH — TOTAL PAYMENT": ["İLK AY — ÜMUMİ ÖDƏNİŞ", "ПЕРВЫЙ МЕСЯЦ — ОБЩАЯ ОПЛАТА"],
  "FROM THE SECOND MONTH": ["İKİNCİ AYDAN ETİBARƏN", "СО ВТОРОГО МЕСЯЦА"],
  "AZN / month": ["AZN / ay", "AZN / месяц"],
  "Installation, system activation and the first month of service are included.": [
    "Quraşdırılma, sistemin aktivləşdirilməsi və ilk aylıq xidmət daxildir.",
    "Установка, активация системы и обслуживание за первый месяц включены.",
  ],
  "Continuous monitoring, analytics, reports and remote support.": [
    "Davamlı monitorinq, analitika, hesabatlar və uzaqdan dəstək.",
    "Непрерывный мониторинг, аналитика, отчёты и удалённая поддержка.",
  ],
  "You do not pay 220 + 120 AZN in the first month. Your first-month total is 220 AZN; every following month is 120 AZN. Pricing covers one facility. Monitoring equipment remains HEAT property during the subscription.": [
    "İlk ay 220 + 120 AZN ödəmirsiniz. İlk ay üçün ümumi ödəniş 220 AZN-dir; sonrakı hər ay 120 AZN-dir. Qiymət bir obyekt üçün nəzərdə tutulub. Abunəlik müddətində monitorinq avadanlığı HEAT-in mülkiyyətində qalır.",
    "В первый месяц вы не платите 220 + 120 AZN. Общая оплата за первый месяц — 220 AZN; каждый следующий месяц — 120 AZN. Цена указана для одного объекта. Во время подписки оборудование остаётся собственностью HEAT.",
  ],
  "EVERYTHING INCLUDED": ["PAKETƏ DAXİLDİR", "ВСЁ ВКЛЮЧЕНО"],
  "HEAT energy monitoring service": ["HEAT enerji monitorinqi xidməti", "Сервис энергомониторинга HEAT"],
  "Smart monitoring device and professional installation": [
    "Ağıllı monitorinq cihazı və peşəkar quraşdırılma",
    "Умное устройство мониторинга и профессиональная установка",
  ],
  "Live energy dashboard and mobile access": [
    "Canlı enerji dashboardu və mobil giriş",
    "Энергопанель в реальном времени и мобильный доступ",
  ],
  "Total and phase-by-phase consumption in kWh and AZN": [
    "Ümumi və fazalar üzrə sərfiyyatın kWh və AZN-lə göstərilməsi",
    "Общее и пофазное потребление в кВт·ч и AZN",
  ],
  "Peak power and possible anomaly alerts": [
    "Pik güc və mümkün anomaliya bildirişləri",
    "Уведомления о пиковых нагрузках и возможных аномалиях",
  ],
  "After-hours consumption monitoring": [
    "İş saatlarından sonrakı sərfiyyatın izlənməsi",
    "Мониторинг потребления после рабочего времени",
  ],
  "Automatic Telegram reports and notifications": [
    "Avtomatik Telegram hesabatları və bildirişləri",
    "Автоматические отчёты и уведомления в Telegram",
  ],
  "Consumption history and cost comparisons": [
    "İstehlak tarixçəsi və xərc müqayisələri",
    "История потребления и сравнение расходов",
  ],
  "Monthly energy review and practical recommendations": [
    "Aylıq enerji təhlili və praktik tövsiyələr",
    "Ежемесячный анализ энергии и практические рекомендации",
  ],
  "Remote technical support and secure data storage": [
    "Uzaqdan texniki dəstək və məlumatların təhlükəsiz saxlanması",
    "Удалённая техническая поддержка и безопасное хранение данных",
  ],
  About: ["Haqqımızda", "О нас"],
  Contact: ["Əlaqə", "Контакты"],
  "Request Demo": ["Demo sifariş edin", "Запросить демо"],
  "Intelligent Energy Analytics for Businesses": [
    "Bizneslər üçün ağıllı enerji analitikası",
    "Интеллектуальная энергоаналитика для бизнеса",
  ],
  "Stop Paying for Invisible": [
    "Görünməyən enerji israfına görə",
    "Перестаньте платить за невидимые",
  ],
  "Energy Waste.": ["artıq pul ödəməyin.", "потери энергии."],
  "HEAT gives businesses real-time visibility into electricity consumption, costs and hidden energy waste — all from one intelligent platform.":
    [
      "HEAT bizneslərə elektrik istehlakını, xərcləri və gizli enerji israfını vahid ağıllı platformada real vaxtda izləmək imkanı verir.",
      "HEAT в реальном времени показывает бизнесу потребление электроэнергии, расходы и скрытые потери — на одной интеллектуальной платформе.",
    ],
  "What HEAT does": ["HEAT nə təklif edir", "Что делает HEAT"],
  "HEAT combines smart monitoring hardware with cloud analytics for restaurants, hotels, offices, retail stores and multi-location businesses.": [
    "HEAT restoranlar, otellər, ofislər, mağazalar və çoxsaylı filialı olan bizneslər üçün ağıllı monitorinq avadanlığını bulud analitikası ilə birləşdirir.",
    "HEAT объединяет умное оборудование мониторинга и облачную аналитику для ресторанов, отелей, офисов, магазинов и сетевого бизнеса.",
  ],
  "Track live power and costs, detect after-hours waste, receive alerts and turn daily energy data into clear operational decisions.": [
      "Cari gücü və xərcləri izləyin, iş saatlarından sonrakı israfı aşkarlayın, xəbərdarlıqlar alın və gündəlik enerji məlumatlarını aydın əməliyyat qərarlarına çevirin.",
    "Отслеживайте мощность и расходы, выявляйте потери после закрытия, получайте уведомления и превращайте ежедневные данные в понятные операционные решения.",
  ],
  "Request a Demo": ["Demo sifariş edin", "Запросить демо"],
  "Explore Platform": ["Platforma ilə tanış olun", "Открыть платформу"],
  "Real-time monitoring": [
    "Real vaxtda monitorinq",
    "Мониторинг в реальном времени",
  ],
  "Cost intelligence": ["Xərclərin təhlili", "Аналитика затрат"],
  "Actionable alerts": ["Operativ xəbərdarlıqlar", "Полезные уведомления"],
  "LIVE PRODUCT PREVIEW": ["PLATFORMANIN CANLI NÜMAYİŞİ", "ДЕМО ПЛАТФОРМЫ"],
  "System online": ["Sistem aktivdir", "Система работает"],
  "Built for businesses where every kilowatt matters.": [
    "Hər kilovatın əhəmiyyətli olduğu bizneslər üçün yaradılıb.",
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
  "Unexpected Peaks": ["Gözlənilməz istehlak pikləri", "Неожиданные пики"],
  "Sudden energy spikes can increase operating costs without being noticed.": [
    "Qəfil enerji sıçrayışları nəzərə çarpmadan xərcləri artıra bilər.",
    "Резкие скачки потребления могут незаметно увеличить расходы.",
  ],
  "No Real-Time Visibility": [
    "Real vaxt göstəricilərinin olmaması",
    "Нет данных в реальном времени",
  ],
  "Traditional electricity bills show what happened — not what is happening now.":
    [
      "Ənənəvi elektrik hesabı indi nə baş verdiyini deyil, keçmişi göstərir.",
      "Обычные счета показывают прошлое, а не то, что происходит сейчас.",
    ],
  "Hidden Operational Waste": [
    "Gizli enerji itkisi",
    "Скрытые операционные потери",
  ],
  "Small inefficiencies across many hours can accumulate into meaningful costs.":
    [
      "Saatlarla davam edən kiçik səmərəsizliklər böyük xərclərə çevrilə bilər.",
      "Небольшие потери за много часов складываются в значительные расходы.",
    ],
  "THE HEAT PLATFORM": ["HEAT PLATFORMASI", "ПЛАТФОРМА HEAT"],
  "One clear view of your energy.": [
    "Enerji istehlakınızı vahid və aydın şəkildə görün.",
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
      "HEAT enerji istehlakı modellərini davamlı təhlil edir, qeyri-adi və lazımsız sərfiyyatı aşkar göstərir.",
      "HEAT постоянно анализирует энергопотребление и выделяет необычные или лишние расходы.",
    ],
  "Waste Detection": ["İsrafın aşkarlanması", "Обнаружение потерь"],
  "Peak Analysis": ["Pik analizi", "Анализ пиков"],
  "Cost Intelligence": ["Xərclərin təhlili", "Аналитика затрат"],
  "After-Hours Monitoring": [
    "İş saatlarından sonrakı monitorinq",
    "Мониторинг после закрытия",
  ],
  "Smart Alerts": ["Ağıllı bildirişlər", "Умные уведомления"],
  "Energy Recommendations": [
    "Enerji tövsiyələri",
    "Энергетические рекомендации",
  ],
  "Identify unusual electricity usage and unnecessary consumption.": [
    "Qeyri-adi elektrik sərfiyyatını və lazımsız istehlakı müəyyən edin.",
    "Выявляйте необычное и ненужное потребление.",
  ],
  "Understand when your business consumes the most energy.": [
    "Biznesinizin ən çox enerjini nə vaxt sərf etdiyini anlayın.",
    "Поймите, когда бизнес потребляет больше всего энергии.",
  ],
  "Translate electricity usage into understandable financial impact.": [
    "Elektrik sərfiyyatını aydın maliyyə göstəricilərinə çevirin.",
    "Переводите расход электричества в понятные финансовые показатели.",
  ],
  "Detect electricity consumption outside working hours.": [
    "İş saatlarından kənar elektrik istehlakını aşkarlayın.",
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
    "EHTİMAL OLUNAN ENERJİ İSRAFI AŞKARLANDI",
    "ОБНАРУЖЕНЫ ВОЗМОЖНЫЕ ПОТЕРИ",
  ],
  "After-hours baseline exceeded": [
    "İş saatlarından sonrakı normal sərfiyyat həddi aşılıb",
    "Превышен базовый уровень после закрытия",
  ],
  "Possible causes": ["Mümkün səbəblər", "Возможные причины"],
  "HVAC running after closing": [
    "İqlimləndirmə sistemi iş saatlarından sonra işləyir",
    "Кондиционер работает после закрытия",
  ],
  "Kitchen equipment left active": [
    "Mətbəx avadanlığı aktiv qalıb",
    "Кухонное оборудование не выключено",
  ],
  "Lighting load": ["İşıqlandırma yükü", "Нагрузка освещения"],
  "Unnecessary consumption": ["Lazımsız istehlak", "Лишнее потребление"],
  "Estimated cost impact": [
    "Xərclərə təxmini təsir",
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
  Measure: ["Ölçmə", "Измерение"],
  Connect: ["Ötürmə", "Подключение"],
  Analyze: ["Təhlil", "Анализ"],
  Alert: ["Xəbərdarlıq", "Уведомление"],
  Optimize: ["Optimallaşdırma", "Оптимизация"],
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
    "Məlumat enerji ilə bağlı daha əsaslandırılmış qərarlar verməyə kömək edir.",
    "Данные помогают принимать лучшие решения.",
  ],
  "BETTER DECISIONS": ["DAHA YAXŞI QƏRARLAR", "ЛУЧШИЕ РЕШЕНИЯ"],
  "Energy visibility that changes the conversation.": [
    "Enerji istehlakına aydın baxış, daha düzgün qərarlar.",
    "Прозрачность энергии, меняющая решения.",
  ],
  "24/7 Monitoring": ["24/7 Monitorinq", "Мониторинг 24/7"],
  "Real-Time Visibility": ["Real vaxtda nəzarət", "Данные в реальном времени"],
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
  "Potential Waste Zone": ["Mümkün israf sahəsi", "Зона возможных потерь"],
  INDUSTRIES: ["SAHƏLƏR", "ОТРАСЛИ"],
  "Built for energy-intensive businesses.": [
    "Enerji tutumlu bizneslər üçün yaradılıb.",
    "Создано для энергоёмкого бизнеса.",
  ],
  "MULTI-LOCATION": ["ÇOXSAYLI OBYEKTLƏR", "НЕСКОЛЬКО ОБЪЕКТОВ"],
  "Every location. One live view.": [
    "Bütün obyektlər. Vahid canlı görünüş.",
    "Все объекты. Один экран.",
  ],
  "Discuss your portfolio": [
    "Obyektlərinizi müzakirə edək",
    "Обсудить ваши объекты",
  ],
  "Location Overview": ["Obyektlərin icmalı", "Обзор объектов"],
  "Total Live Consumption": [
    "Hazırkı ümumi istehlak",
    "Общее текущее потребление",
  ],
  Normal: ["Normal", "Норма"],
  Warning: ["Xəbərdarlıq", "Внимание"],
  "Baku, Azerbaijan": ["Bakı, Azərbaycan", "Баку, Азербайджан"],
  "HEAT Daily Energy Report": [
    "HEAT gündəlik enerji hesabatı",
    "Ежедневный отчёт HEAT",
  ],
  "Today’s Usage": ["Bugünkü enerji istehlakı", "Расход сегодня"],
  "Estimated Cost": ["Təxmini xərc", "Расчётная стоимость"],
  "Peak Power": ["Pik güc", "Пиковая мощность"],
  "Peak Time": ["Pik vaxtı", "Время пика"],
  "After-Hours Usage": [
    "İş saatlarından sonrakı istehlak",
    "Расход после закрытия",
  ],
  RECOMMENDATION: ["TÖVSİYƏ", "РЕКОМЕНДАЦИЯ"],
  "View Full Report": ["Tam hesabata bax", "Открыть полный отчёт"],
  "Request a sample report": ["Nümunə hesabat istəyin", "Запросить пример отчёта"],
  "FLEXIBLE PLANS": ["ÇEVİK PLANLAR", "ГИБКИЕ ТАРИФЫ"],
  "Built around your operation.": [
    "Biznesinizə uyğun qurulur.",
    "Подстроено под ваш бизнес.",
  ],
  Monitoring: ["Monitorinq", "Мониторинг"],
  Enterprise: ["Korporativ", "Корпоративный"],
  RECOMMENDED: ["TÖVSİYƏ OLUNUR", "РЕКОМЕНДУЕМ"],
  "Contact for Pricing": ["Qiymət üçün əlaqə saxlayın", "Узнать стоимость"],
  "Request Quote": ["Qiymət təklifi istəyin", "Запросить предложение"],
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
  Visibility: ["Şəffaflıq", "Прозрачность"],
  Efficiency: ["Səmərəlilik", "Эффективность"],
  Technology: ["Texnologiya", "Технологии"],
  "START SEEING ENERGY DIFFERENTLY": [
    "ENERJİYƏ FƏRQLİ BAXIN",
    "ПОСМОТРИТЕ НА ЭНЕРГИЮ ИНАЧЕ",
  ],
  "You can’t optimize": ["Görmədiyinizi", "Нельзя оптимизировать то,"],
  "what you can’t see.": ["optimallaşdıra bilməzsiniz.", "чего вы не видите."],
  "Request a Free Demo": [
    "Pulsuz demo sifariş edin",
    "Запросить бесплатное демо",
  ],
  CONTACT: ["ƏLAQƏ", "КОНТАКТЫ"],
  "Let’s talk about your energy usage.": [
    "Enerji istehlakınız haqqında danışaq.",
    "Обсудим ваше энергопотребление.",
  ],
  "Full Name": ["Ad və soyad", "Имя и фамилия"],
  "Your name": ["Adınız", "Ваше имя"],
  "Company Name": ["Şirkət adı", "Название компании"],
  "Business Type": ["Fəaliyyət sahəsi", "Тип бизнеса"],
  "Select type": ["Fəaliyyət sahəsini seçin", "Выберите тип"],
  "Phone Number": ["Telefon nömrəsi", "Номер телефона"],
  "Number of Locations": ["Obyektlərin sayı", "Количество объектов"],
  "Average Monthly Electricity Cost": [
    "Orta aylıq elektrik xərci",
    "Средние расходы на электричество в месяц",
  ],
  Message: ["Əlavə məlumat", "Сообщение"],
  "Request Energy Assessment": [
    "Enerji qiymətləndirməsi istəyin",
    "Запросить энергооценку",
  ],
  "Request received.": ["Sorğu qəbul edildi.", "Заявка получена."],
  "Send another request": ["Yeni sorğu göndərin", "Отправить ещё одну заявку"],
  Email: ["E-poçt", "Эл. почта"],
  Phone: ["Telefon", "Телефон"],
  Location: ["Ünvan", "Адрес"],
  Product: ["Məhsul", "Продукт"],
  Company: ["Şirkət", "Компания"],
  Privacy: ["Məxfilik", "Конфиденциальность"],
  Legal: ["Hüquqi", "Правовая информация"],
  "Energy Analytics": ["Enerji analitikası", "Энергоаналитика"],
  "Demo Data": ["Nümayiş məlumatları", "Демо-данные"],
  "Real-Time Power": ["Cari güc", "Текущая мощность"],
  "Today’s Energy": ["Bugünkü enerji", "Энергия сегодня"],
  "Today's Energy": ["Bugünkü enerji", "Энергия сегодня"],
  "Today’s Cost": ["Bugünkü xərc", "Расходы сегодня"],
  "Today's Cost": ["Bugünkü xərc", "Расходы сегодня"],
  "Power Factor": ["Güc əmsalı", "Коэффициент мощности"],
  Voltage: ["Gərginlik", "Напряжение"],
  "Today’s Consumption": ["Bugünkü istehlak", "Потребление сегодня"],
  "Today's Consumption": ["Bugünkü istehlak", "Потребление сегодня"],
  Overview: ["İcmal", "Обзор"],
  "Live Energy": ["Cari enerji göstəriciləri", "Энергия онлайн"],
  Reports: ["Hesabatlar", "Отчёты"],
  Locations: ["Məkanlar", "Объекты"],
  Devices: ["Cihazlar", "Устройства"],
  Settings: ["Ayarlar", "Настройки"],
  "Energy Overview": ["Enerji icmalı", "Обзор энергии"],
  Today: ["Bu gün", "Сегодня"],
  "Monthly Usage": ["Aylıq istehlak", "Расход за месяц"],
  "Monthly Estimate": ["Aylıq proqnoz", "Прогноз на месяц"],
  "Energy Consumption": ["Enerji istehlakı", "Энергопотребление"],
  Week: ["Həftə", "Неделя"],
  Month: ["Ay", "Месяц"],
  "Energy Cost": ["Enerji xərci", "Стоимость энергии"],
  "Monthly Savings": ["Aylıq qənaət", "Экономия за месяц"],
  "Budget Used": ["İstifadə olunan büdcə", "Использованный бюджет"],
  "After-Hours Loss": ["İş saatından sonrakı itki", "Потери в нерабочее время"],
  "Energy Score": ["Enerji balı", "Энергетический рейтинг"],
  "AI ACTION PLAN": ["AI FƏALİYYƏT PLANI", "ПЛАН ДЕЙСТВИЙ ИИ"],
  "Shift high-power equipment starts by 10–15 minutes": ["Yüksək güclü avadanlıqların işə salınmasını 10–15 dəqiqə fərqləndirin", "Запускайте мощное оборудование с интервалом 10–15 минут"],
  "Potential saving: 24.60 AZN": ["Qənaət potensialı: 24.60 AZN", "Потенциал экономии: 24.60 AZN"],
  "This Month": ["Bu ay", "Этот месяц"],
  Projected: ["Proqnoz", "Прогноз"],
  "Sending…": ["Göndərilir…", "Отправка…"],
  "Your request could not be sent. Please try again or email us directly.": [
    "Sorğu göndərilmədi. Yenidən cəhd edin və ya bizə birbaşa e-poçt yazın.",
    "Не удалось отправить заявку. Повторите попытку или напишите нам напрямую.",
  ],
  "Select language": ["Dil seçin", "Выберите язык"],
  "Toggle navigation": ["Menyunu açın və ya bağlayın", "Открыть или закрыть меню"],
  "HEAT home": ["HEAT ana səhifəsi", "Главная страница HEAT"],
  "vs. yesterday": ["dünənlə müqayisədə", "по сравнению со вчера"],
  "See Energy. Stop Waste.": ["Enerjini görün. İsrafı dayandırın.", "Видьте энергию. Остановите потери."],
  Analytics: ["Analitika", "Аналитика"],
  Alerts: ["Xəbərdarlıqlar", "Уведомления"],
  "© 2026 HEAT — Hasanov Energy & Technology. All rights reserved.": [
    "© 2026 HEAT — Hasanov Energy & Technology. Bütün hüquqlar qorunur.",
    "© 2026 HEAT — Hasanov Energy & Technology. Все права защищены.",
  ],
  "HEAT INTELLIGENCE": ["HEAT AĞILLI ANALİTİKASI", "ИНТЕЛЛЕКТ HEAT"],
  "HEAT Intelligence": ["HEAT ağıllı analitikası", "Интеллект HEAT"],
  ANALYZED: ["TƏHLİL EDİLİB", "ПРОАНАЛИЗИРОВАНО"],
  "Power consumption remained": ["00:20–03:45 aralığında güc sərfiyyatı", "Потребление мощности оставалось"],
  "8.4 kW above expected baseline": ["gözlənilən səviyyədən 8,4 kVt yüksək olub.", "на 8,4 кВт выше ожидаемого уровня"],
  "between 00:20 and 03:45.": ["", "с 00:20 до 03:45."],
  "Illustrative demo insight. Actual results depend on site data and operating conditions.": [
    "Bu, nümunə məqsədli demo təhlilidir. Faktiki nəticələr obyektin məlumatlarından və iş şəraitindən asılıdır.",
    "Это демонстрационный пример. Фактические результаты зависят от данных объекта и условий работы.",
  ],
  "HEAT Alert": ["HEAT xəbərdarlığı", "Уведомление HEAT"],
  now: ["indi", "сейчас"],
  "HEAT ALERT": ["HEAT XƏBƏRDARLIĞI", "УВЕДОМЛЕНИЕ HEAT"],
  "Your location is consuming": ["Obyektiniz", "Ваш объект потребляет"],
  "above its normal after-hours baseline.": ["iş saatlarından sonrakı normal səviyyədən artıq enerji sərf edir.", "выше обычного уровня после закрытия."],
  "Estimated extra usage": ["Təxmini əlavə sərfiyyat", "Расчётный дополнительный расход"],
  "Know when it matters,": ["Vacib anda xəbərdar olun,", "Узнавайте вовремя,"],
  "wherever you are.": ["harada olmağınızdan asılı olmayaraq.", "где бы вы ни находились."],
  "Electrical Panel": ["Elektrik lövhəsi", "Электрощит"],
  "Energy Meter": ["Enerji sayğacı", "Счётчик энергии"],
  "Secure Connection": ["Təhlükəsiz bağlantı", "Безопасное соединение"],
  "HEAT Cloud": ["HEAT bulud sistemi", "Облако HEAT"],
  "Dashboard + Alerts": ["İdarəetmə paneli və xəbərdarlıqlar", "Панель и уведомления"],
  "Understand consumption beyond monthly bills.": ["Aylıq hesabların göstərmədiyi sərfiyyatı anlayın.", "Понимайте расход за пределами месячных счетов."],
  "See what your business is consuming right now.": ["Biznesinizin hazırda nə qədər enerji sərf etdiyini görün.", "Видьте текущее потребление бизнеса."],
  "Manage branches from one platform.": ["Bütün filialları vahid platformadan idarə edin.", "Управляйте филиалами с одной платформы."],
  "Convert energy data into clear operational insights.": ["Enerji məlumatlarını aydın və praktik qərarlara çevirin.", "Превращайте данные в понятные операционные выводы."],
  "24-HOUR VIEW": ["24 SAATLIQ GÖRÜNÜŞ", "ОБЗОР ЗА 24 ЧАСА"],
  "Business hours end at 23:00. Your baseline consumption should fall with them. HEAT makes the remaining load easy to see.": [
    "İş saatları 23:00-da bitir və normal sərfiyyat da bundan sonra azalmalıdır. HEAT qalan yükü aydın şəkildə göstərir.",
    "Рабочий день заканчивается в 23:00, и базовое потребление должно снижаться. HEAT наглядно показывает оставшуюся нагрузку.",
  ],
  "Potential waste zone": ["Mümkün israf sahəsi", "Зона возможных потерь"],
  "Kitchens, HVAC, refrigeration and lighting.": ["Mətbəx, iqlimləndirmə, soyutma və işıqlandırma sistemləri.", "Кухня, климат, охлаждение и освещение."],
  "Daily patterns and after-hours usage.": ["Gündəlik istehlak modeli və iş saatlarından sonrakı sərfiyyat.", "Суточные модели и расход после закрытия."],
  "Continuous consumption and operating demand.": ["Fasiləsiz sərfiyyat və əməliyyat yükü.", "Непрерывное потребление и рабочая нагрузка."],
  "Compare stores and locations.": ["Mağazaları və obyektləri müqayisə edin.", "Сравнивайте магазины и объекты."],
  "HVAC, lighting and equipment usage.": ["İqlimləndirmə, işıqlandırma və avadanlıq sərfiyyatı.", "Расход систем климата, освещения и оборудования."],
  "Visibility across complex environments.": ["Mürəkkəb obyektlər üzrə vahid nəzarət.", "Единый контроль сложных объектов."],
  "Monitor total demand, compare branches and spot the location that needs attention—without switching tools.": [
    "Ümumi tələbatı izləyin, filialları müqayisə edin və əlavə diqqət tələb edən obyekti vahid platformada müəyyənləşdirin.",
    "Контролируйте общий спрос, сравнивайте филиалы и находите объект, требующий внимания, в одной платформе.",
  ],
  "Centralized operational overview": ["Mərkəzləşdirilmiş əməliyyat icmalı", "Централизованный операционный обзор"],
  "Location-level alerts": ["Obyekt üzrə xəbərdarlıqlar", "Уведомления по объектам"],
  "Portfolio-wide consumption trends": ["Bütün obyektlər üzrə istehlak meyilləri", "Тенденции потребления по всем объектам"],
  "All facilities · Live": ["Bütün obyektlər · Canlı", "Все объекты · Онлайн"],
  "4 online": ["4 obyekt aktivdir", "4 объекта онлайн"],
  "Across 4 locations": ["4 obyekt üzrə", "По 4 объектам"],
  "Nizami Restaurant": ["Nizami restoranı", "Ресторан Nizami"],
  "White City Café": ["Ağ Şəhər kafesi", "Кафе White City"],
  "Port Baku Office": ["Port Baku ofisi", "Офис Port Baku"],
  "Baku Mall Store": ["Baku Mall mağazası", "Магазин Baku Mall"],
  "Baku city center": ["Bakı şəhər mərkəzi", "Центр Баку"],
  "Demo Restaurant": ["Demo restoran", "Демо-ресторан"],
  "Demo Restaurant · 09 August 2026": ["Demo restoran · 9 avqust 2026", "Демо-ресторан · 9 августа 2026"],
  DAILY: ["GÜNDƏLİK", "ЕЖЕДНЕВНО"],
  "14.7%": ["Bugünkü elektrik sərfiyyatının 14,7%-i", "14,7% сегодняшнего расхода"],
  "of today's electricity use happened after hours.": [
    "iş saatlarından sonrakı dövrə təsadüf edib.",
    "пришлось на время после закрытия.",
  ],
  "of today’s electricity use happened after": ["bugünkü elektrik sərfiyyatının", "сегодняшнего расхода пришлось на"],
  "hours.": ["iş saatlarından sonrakı dövrə təsadüf edib.", "вне рабочего времени."],
  "Review HVAC and kitchen equipment shutdown procedures after closing.": [
    "İş bitdikdən sonra iqlimləndirmə və mətbəx avadanlıqlarının söndürülməsi qaydalarını nəzərdən keçirin.",
    "Проверьте порядок отключения климатического и кухонного оборудования после закрытия.",
  ],
  "REPORTS THAT MAKE SENSE": ["AYDIN VƏ FAYDALI HESABATLAR", "ПОНЯТНЫЕ ОТЧЁТЫ"],
  "From a day of energy data to one clear next step.": ["Bir günlük enerji məlumatından konkret növbəti addıma.", "От дневных данных к одному понятному шагу."],
  "HEAT turns consumption, costs and peaks into a concise report your team can use—without needing an energy analyst.": [
    "HEAT istehlak, xərc və pik göstəricilərini enerji mütəxəssisinə ehtiyac olmadan komandanızın istifadə edə biləcəyi qısa və aydın hesabata çevirir.",
    "HEAT превращает расход, стоимость и пики в краткий отчёт, понятный команде без помощи энергоаналитика.",
  ],
  "Real-Time Monitoring": ["Real vaxtda monitorinq", "Мониторинг в реальном времени"],
  "Energy Dashboard": ["Enerji idarəetmə paneli", "Энергетическая панель"],
  "Daily Consumption": ["Gündəlik istehlak", "Суточное потребление"],
  "Cost Estimates": ["Təxmini xərclər", "Оценка затрат"],
  "Weekly Reports": ["Həftəlik hesabatlar", "Еженедельные отчёты"],
  "Everything in Monitoring": ["Monitorinq planındakı bütün imkanlar", "Все возможности тарифа Мониторинг"],
  "Analytics Reports": ["Analitik hesabatlar", "Аналитические отчёты"],
  Recommendations: ["Tövsiyələr", "Рекомендации"],
  "Multiple Locations": ["Çoxsaylı obyektlər", "Несколько объектов"],
  "Advanced Analytics": ["Təkmil analitika", "Расширенная аналитика"],
  "Central Management": ["Mərkəzləşdirilmiş idarəetmə", "Централизованное управление"],
  "Custom Reporting": ["Fərdi hesabatlar", "Индивидуальная отчётность"],
  "Priority Support": ["Prioritet dəstək", "Приоритетная поддержка"],
  "Custom Integration": ["Fərdi inteqrasiya", "Индивидуальная интеграция"],
  "Every site is different. We’ll recommend the right monitoring and analytics setup for your business.": [
    "Hər obyekt fərqlidir. Biznesiniz üçün uyğun monitorinq və analitika həllini tövsiyə edəcəyik.",
    "Каждый объект уникален. Мы предложим подходящее решение для мониторинга и аналитики.",
  ],
  "A tailored HEAT setup for your facility and operational needs.": ["Obyektinizə və əməliyyat ehtiyaclarınıza uyğun HEAT həlli.", "Решение HEAT под ваш объект и операционные потребности."],
  "Monthly information": ["Aylıq məlumat", "Ежемесячная информация"],
  "Historical data": ["Keçmiş dövr məlumatları", "Исторические данные"],
  "Limited visibility": ["Məhdud görünüş", "Ограниченная прозрачность"],
  "No immediate alerts": ["Operativ xəbərdarlıq yoxdur", "Нет оперативных уведомлений"],
  "Visual analytics": ["Vizual analitika", "Визуальная аналитика"],
  "Cost tracking": ["Xərclərin izlənməsi", "Отслеживание затрат"],
  "Anomaly detection": ["Anomaliyaların aşkarlanması", "Обнаружение аномалий"],
  "Historical comparisons": ["Tarixi müqayisələr", "Исторические сравнения"],
  "Multi-location overview": ["Çoxsaylı obyektlərin icmalı", "Обзор нескольких объектов"],
  "HEAT — Hasanov Energy & Technology is an EnergyTech initiative focused on helping businesses better understand and manage electricity consumption through monitoring, analytics and intelligent automation.": [
    "HEAT — Hasanov Energy & Technology bizneslərə monitorinq, analitika və ağıllı avtomatlaşdırma vasitəsilə elektrik istehlakını daha yaxşı anlamağa və idarə etməyə kömək edən enerji texnologiyaları təşəbbüsüdür.",
    "HEAT — Hasanov Energy & Technology — энергетическая технологическая инициатива, помогающая бизнесу управлять потреблением с помощью мониторинга, аналитики и автоматизации.",
  ],
  "Our goal is to transform complex energy data into simple, useful information that business owners can act on.": [
    "Məqsədimiz mürəkkəb enerji məlumatlarını biznes sahiblərinin praktik qərarlarda istifadə edə biləcəyi sadə və faydalı məlumata çevirməkdir.",
    "Наша цель — превращать сложные энергетические данные в простую и полезную информацию для принятия решений.",
  ],
  "Discover how HEAT can give your business better visibility into electricity consumption.": ["HEAT-in biznesinizə elektrik istehlakı üzərində daha aydın nəzarəti necə təmin etdiyini öyrənin.", "Узнайте, как HEAT помогает бизнесу лучше контролировать энергопотребление."],
  "Tell us a little about your operation. We’ll explore where better energy visibility could make a difference.": [
    "Fəaliyyətiniz haqqında qısa məlumat verin. Enerji istehlakına daha aydın nəzarətin biznesinizə harada fayda verə biləcəyini birlikdə müəyyənləşdirək.",
    "Расскажите о вашем бизнесе, и мы определим, где прозрачность энергопотребления принесёт пользу.",
  ],
  "Thank you. The HEAT team will contact you to discuss your energy assessment.": ["Təşəkkür edirik. HEAT komandası enerji qiymətləndirməsini müzakirə etmək üçün sizinlə əlaqə saxlayacaq.", "Спасибо. Команда HEAT свяжется с вами для обсуждения энергооценки."],
  "Company name": ["Şirkətin adı", "Название компании"],
  "you@company.com": ["siz@sirket.az", "вы@компания.az"],
  "Restaurant / Café": ["Restoran / Kafe", "Ресторан / Кафе"],
  Hotel: ["Otel", "Отель"],
  Office: ["Ofis", "Офис"],
  "Business Center": ["Biznes mərkəzi", "Бизнес-центр"],
  Other: ["Digər", "Другое"],
  "e.g. 1,500 AZN": ["məsələn, 1 500 AZN", "например, 1 500 AZN"],
  "Tell us about your facility and energy goals.": ["Obyektiniz və enerji məqsədləriniz haqqında məlumat verin.", "Расскажите об объекте и ваших энергетических целях."],
  "By submitting, you agree to be contacted by the HEAT team.": ["Sorğunu göndərməklə HEAT komandasının sizinlə əlaqə saxlamasına razılıq verirsiniz.", "Отправляя заявку, вы соглашаетесь на связь с командой HEAT."],
  "Power demand throughout the day": ["Gün ərzində güc tələbatı", "Потребность в мощности в течение дня"],
  "Power / Est. cost": ["Güc / Təxmini xərc", "Мощность / Расчётная стоимость"],
  LIVE: ["CANLI", "ОНЛАЙН"],
  "Live update": ["Canlı yenilənmə", "Обновление онлайн"],
  "Updated just now": ["İndicə yenilənib", "Обновлено только что"],
  "Baku, AZ": ["Bakı, AZ", "Баку, AZ"],
  "SUNDAY, AUGUST 9": ["BAZAR, 9 AVQUST", "ВОСКРЕСЕНЬЕ, 9 АВГУСТА"],
  "Demo Restaurant — Baku": ["Demo restoran — Bakı", "Демо-ресторан — Баку"],
  "System Online": ["Sistem aktivdir", "Система работает"],
  "Last updated: Live": ["Son yenilənmə: canlı", "Последнее обновление: онлайн"],
  NORMAL: ["NORMAL", "НОРМА"],
  "Range 0 — 50 kW": ["Aralıq: 0–50 kVt", "Диапазон: 0–50 кВт"],
  "On track": ["Plana uyğundur", "По плану"],
  Excellent: ["Əla", "Отлично"],
  "Current billing cycle": ["Cari hesablaşma dövrü", "Текущий расчётный период"],
  "73% of projected monthly cost": ["Proqnozlaşdırılan aylıq xərcin 73%-i", "73% прогнозируемых месячных затрат"],
};

Object.assign(copy, {
  "Select language": ["Dil seçin", "Выберите язык"],
  Provisioning: ["Quraşdırma", "Настройка"],
  Customers: ["Müştərilər", "Клиенты"],
  "New customer system": ["Yeni müştəri sistemi", "Новая система клиента"],
  "Enter the information so the provisioner creates a separate, isolated energy monitoring system.": ["Məlumatları daxil edin — provisioner ayrıca və izolə edilmiş enerji monitorinq sistemi qursun.", "Введите данные — система развёртывания создаст отдельную изолированную систему энергомониторинга."],
  "Provisioner agent": ["Provisioner agent", "Агент развёртывания"],
  Waiting: ["Gözləyir", "Ожидает"],
  "Customer systems": ["Müştəri sistemləri", "Системы клиентов"],
  "Each customer has a separate token and dashboard. As admin, you can view all of them.": ["Hər müştərinin tokeni və dashboardu ayrıdır. Siz admin kimi hamısına baxa bilərsiniz.", "У каждого клиента отдельный токен и дашборд. Администратор может просматривать их все."],
  Refresh: ["Yenilə", "Обновить"],
  Customer: ["Müştəri", "Клиент"],
  Device: ["Cihaz", "Устройство"],
  Mode: ["Rejim", "Режим"],
  Status: ["Status", "Статус"],
  "Admin view": ["Admin baxışı", "Просмотр администратора"],
  "Customer login": ["Müştəri girişi", "Вход клиента"],
  Edit: ["Edit", "Изменить"],
  Vault: ["Seyf", "Хранилище"],
  Queued: ["Növbədə", "В очереди"],
  Installing: ["Qurulur", "Устанавливается"],
  Active: ["Aktiv", "Активна"],
  Error: ["Xəta", "Ошибка"],
  "Daily demo": ["Gündəlik demo", "Ежедневное демо"],
  "Demo active": ["Demo aktivdir", "Демо активно"],
  "View dashboard": ["Dashboarda bax", "Открыть дашборд"],
  "Demo information": ["Demo məlumatları", "Демо-данные"],
  "Mobile account active": ["Mobil hesab aktivdir", "Мобильный аккаунт активен"],
  "Customer token": ["Müştəri tokeni", "Токен клиента"],
  "View vault": ["Seyfə bax", "Открыть хранилище"],
  Preparation: ["Hazırlıq", "Подготовка"],
  "You define it": ["Özün təyin edirsən", "Задаётся вами"],
  "Taken from another system — hover over the asterisk": ["Başqa sistemdən götürülür — ulduzun üzərinə gəl", "Берётся из другой системы — наведите на звёздочку"],
  "Customer and facility": ["Müştəri və obyekt", "Клиент и объект"],
  "Identification information displayed in the system.": ["Sistemdə görünəcək identifikasiya məlumatları.", "Идентификационные данные, отображаемые в системе."],
  "Customer name": ["Müştəri adı", "Название клиента"],
  "Customer slug": ["Müştəri slug", "Slug клиента"],
  "Facility name": ["Obyekt adı", "Название объекта"],
  "Device name": ["Cihaz adı", "Название устройства"],
  "Device model": ["Cihaz modeli", "Модель устройства"],
  "Main electrical panel": ["Baş elektrik paneli", "Главный электрощит"],
  "Collector mode": ["Collector rejimi", "Режим сбора"],
  "Polling — initial setup": ["Polling — ilk quraşdırma", "Опрос — первичная настройка"],
  "Cloud Key is stored only in encrypted form in the customer vault.": ["Cloud Key yalnız şifrələnmiş halda müştəri seyfində saxlanır.", "Cloud Key хранится в хранилище клиента только в зашифрованном виде."],
  "InfluxDB and Grafana": ["InfluxDB və Grafana", "InfluxDB и Grafana"],
  "Passwords use the customer slug prefix; the admin token is generated randomly.": ["Parollar müştəri slug prefiksi ilə, admin token isə təsadüfi yaradılır.", "Пароли используют префикс slug клиента, а токен администратора создаётся случайно."],
  "Generate secure values": ["Təhlükəsiz dəyərlər yarat", "Создать безопасные значения"],
  "Fixed electricity tariff — AZN/kWh": ["Elektrik tarifi — sabit AZN/kWh", "Фиксированный тариф — AZN/кВт·ч"],
  "Write, analytics-read and Grafana-read tokens are created automatically during setup.": ["Write, analytics-read və Grafana-read tokenləri quraşdırma zamanı avtomatik yaradılır.", "Токены write, analytics-read и Grafana-read создаются автоматически при настройке."],
  "Optional notification and reporting channel.": ["İstəyə bağlı bildiriş və hesabat kanalı.", "Необязательный канал уведомлений и отчётов."],
  Enable: ["Aktiv et", "Включить"],
  "Allowed chat IDs": ["Allowed chat ID-lər", "Разрешённые chat ID"],
  "Daily automatic report count": ["Gündəlik avtomatik report sayı", "Количество автоматических отчётов в день"],
  "Phase A name": ["Faza A adı", "Название фазы A"],
  "Phase B name": ["Faza B adı", "Название фазы B"],
  "Phase C name": ["Faza C adı", "Название фазы C"],
  "Phase A": ["Faza A", "Фаза A"],
  "Phase B": ["Faza B", "Фаза B"],
  "Phase C": ["Faza C", "Фаза C"],
  "Facility details": ["Məkan haqqında ətraflı", "Подробно об объекте"],
  "Used to compare energy measurements with the facility's real operating mode and provide more accurate advice.": ["Enerji ölçmələrini obyektin real iş rejimi ilə müqayisə edib daha dəqiq məsləhət vermək üçündür.", "Используется для сопоставления измерений с реальным режимом работы объекта и более точных рекомендаций."],
  "AI CONTEXT": ["AI KONTEKSTİ", "КОНТЕКСТ ИИ"],
  "Business / facility type": ["Biznes / məkan növü", "Тип бизнеса / объекта"],
  "Working hours": ["İş saatları", "Часы работы"],
  "Closed days": ["Bağlı günlər", "Выходные дни"],
  "Main electrical equipment": ["Əsas elektrik avadanlıqları", "Основное электрооборудование"],
  "Always-on equipment": ["Daim işləməli avadanlıqlar", "Постоянно работающее оборудование"],
  "Energy goal": ["Enerji məqsədi", "Цель энергосбережения"],
  "Additional information": ["Əlavə məlumat", "Дополнительная информация"],
  "Do not enter passwords, tokens, Cloud Keys or personal information here. Only this facility description and energy metrics are sent to AI.": ["Buraya parol, token, Cloud Key və şəxsi məlumat yazmayın. AI-yə yalnız bu məkan təsviri və enerji göstəriciləri ötürülür.", "Не вводите здесь пароли, токены, Cloud Key или персональные данные. ИИ получает только описание объекта и показатели энергии."],
  "Information is stored in an encrypted vault and is visible only to the admin.": ["Məlumatlar şifrələnmiş seyfdə saxlanır və yalnız adminə göstərilir.", "Данные хранятся в зашифрованном хранилище и доступны только администратору."],
  "Create customer system": ["Müştəri sistemini qur", "Создать систему клиента"],
  "Adding to queue": ["Növbəyə əlavə edilir", "Добавление в очередь"],
  "Customer added to queue": ["Müştəri növbəyə əlavə edildi", "Клиент добавлен в очередь"],
  "The local provisioner will install the system. Status will update automatically.": ["Lokal provisioner agent sistemi quracaq. Status siyahıda avtomatik yenilənəcək.", "Локальный агент развёртывания установит систему. Статус обновится автоматически."],
  "New customer": ["Yeni müştəri", "Новый клиент"],
  "CUSTOMER PORTAL": ["MÜŞTƏRİ PORTALI", "ПОРТАЛ КЛИЕНТА"],
  "Log in to your dashboard": ["Öz dashboardunuza giriş", "Вход в ваш дашборд"],
  "Enter the personal access token issued by HEAT only for your facility.": ["HEAT tərəfindən yalnız sizin obyektiniz üçün verilmiş şəxsi giriş tokenini daxil edin.", "Введите персональный токен доступа, выданный HEAT только для вашего объекта."],
  "Access token": ["Giriş tokeni", "Токен доступа"],
  "Hide token": ["Tokeni gizlət", "Скрыть токен"],
  "Show token": ["Tokeni göstər", "Показать токен"],
  "Checking...": ["Yoxlanılır...", "Проверка..."],
  "Open dashboard": ["Dashboarda daxil ol", "Открыть дашборд"],
  "This token opens only your dashboard. It does not grant access to the admin panel.": ["Bu token yalnız sizə aid dashboardu açır. Admin panelinə giriş vermir.", "Этот токен открывает только ваш дашборд и не даёт доступа к панели администратора."],
  "This login is only for the customer dashboard": ["Bu giriş yalnız müştəri dashboardu üçündür", "Этот вход предназначен только для дашборда клиента"],
  "Customer dashboard": ["Müştəri dashboardu", "Дашборд клиента"],
  Logout: ["Çıxış", "Выйти"],
  Normal: ["Normal", "Норма"],
  "Peak load": ["Pik yük", "Пиковая нагрузка"],
  Anomaly: ["Anomaliya", "Аномалия"],
  Attention: ["Diqqət", "Внимание"],
  "Shelly connected": ["Shelly qoşulub", "Shelly подключён"],
  "InfluxDB is recording": ["InfluxDB yazır", "InfluxDB записывает"],
  "Grafana is ready": ["Grafana hazırdır", "Grafana готова"],
  "Telegram is active": ["Telegram aktivdir", "Telegram активен"],
  "Current power": ["Hazırkı güc", "Текущая мощность"],
  "Live measurement": ["Canlı ölçü", "Текущее измерение"],
  "Last completed day": ["Son tamamlanmış gün", "Последний завершённый день"],
  "Yesterday's value": ["Dünənin göstəricisi", "Показатель за вчера"],
  "Monthly forecast": ["Aylıq proqnoz", "Прогноз на месяц"],
  "System status": ["Sistem statusu", "Состояние системы"],
  "No problems": ["Problem yoxdur", "Проблем нет"],
  "Check required": ["Yoxlama lazımdır", "Требуется проверка"],
  "24-hour power": ["24 saatlıq güc", "Мощность за 24 часа"],
  "Phases configured during setup": ["Qurulumda təyin edilmiş fazalar", "Фазы, заданные при настройке"],
  "Phases and lines": ["Fazalar və xətlər", "Фазы и линии"],
  "AI RECOMMENDATIONS": ["AI MƏSLƏHƏTLƏRİ", "РЕКОМЕНДАЦИИ ИИ"],
  "FACILITY PROFILE ACTIVE": ["MƏKAN PROFİLİ AKTİVDİR", "ПРОФИЛЬ ОБЪЕКТА АКТИВЕН"],
  "ENERGY ANALYSIS": ["ENERJİ ANALİZİ", "АНАЛИЗ ЭНЕРГИИ"],
  "Consumption is normal": ["İstehlak normaldır", "Потребление в норме"],
  "Peak load detected": ["Pik yük müəyyən edildi", "Обнаружена пиковая нагрузка"],
  "Unusual load on Phase A": ["Faza A-da qeyri-adi yük", "Необычная нагрузка на фазе A"],
  "This is a preliminary automated analysis, not an electrical safety diagnosis.": ["Bu ilkin avtomatik analizdir; elektrik təhlükəsizliyi diaqnozu deyil.", "Это предварительный автоматический анализ, а не диагностика электробезопасности."],
  online: ["online", "онлайн"],
  now: ["indi", "сейчас"],
  "System is normal": ["Sistem normaldır", "Система в норме"],
  "Peak load warning": ["Pik yük xəbərdarlığı", "Предупреждение о пиковой нагрузке"],
  "Anomaly detected": ["Anomaliya aşkarlandı", "Обнаружена аномалия"],
  "Daily automatic demo": ["Gündəlik avtomatik demo", "Ежедневное автоматическое демо"],
  "Demo view": ["Demo görünüşü", "Демо-режим"],
  "Real energy data will appear in Grafana when the system is active.": ["Real enerji məlumatları sistem aktiv olduqda Grafana-da görünəcək.", "Реальные данные энергопотребления появятся в Grafana после активации системы."],
  "ENERGY MONITORING": ["ENERGY MONITORING", "МОНИТОРИНГ ЭНЕРГИИ"],
  "Day 2 of the month": ["Ayın 2-ci günü", "2-й день месяца"],
  "24-hour power graph for three phases": ["Üç fazanın 24 saatlıq güc qrafiki", "24-часовой график мощности трёх фаз"],
  "The refrigerator and tea machine load is within the expected operating range. No action is currently required.": ["Soyuducu və çay aparatının yükü gözlənilən iş rejimindədir. Hazırda müdaxilə tələb olunmur.", "Нагрузка холодильника и чайного аппарата соответствует ожидаемому режиму. Сейчас вмешательство не требуется."],
  "After closing, check the samovar and lighting circuits using the checklist.": ["Bağlanışdan sonra samovar və işıq xətlərini yoxlama siyahısı ilə nəzarət edin.", "После закрытия проверьте линии самовара и освещения по контрольному списку."],
  "Monitor the nighttime consumption of refrigerators that must remain on separately.": ["Daim işləməli soyuducuların gecə sərfiyyatını ayrıca izləyin.", "Отдельно отслеживайте ночное потребление холодильников, которые должны работать постоянно."],
  "The tea machine, oven and air conditioner are running at the same time. Delaying the oven by 15 minutes may reduce the peak load.": ["Çay aparatı, soba və kondisioner eyni vaxtda işləyir. Sobanın işini 15 dəqiqə gecikdirmək pik yükü azalda bilər.", "Чайный аппарат, печь и кондиционер работают одновременно. Задержка включения печи на 15 минут может снизить пиковую нагрузку."],
  "Start high-power equipment 10–15 minutes apart.": ["Yüksək güclü avadanlıqları 10–15 dəqiqə fərqlə işə salın.", "Включайте мощное оборудование с интервалом 10–15 минут."],
  "If the peak repeats, compare the work schedule for that hour.": ["Pik təkrarlanarsa həmin saatdakı iş cədvəlini müqayisə edin.", "Если пик повторится, сопоставьте его с графиком работы в этот час."],
  "After closing time, continuous consumption of 6.10 kW is visible on Phase A. Check that the tea machine and oven are switched off.": ["Bağlanış saatından sonra Faza A-da 6.10 kW davamlı istehlak görünür. Çay aparatı və sobanın söndürüldüyünü yoxlayın.", "После закрытия на фазе A наблюдается постоянное потребление 6,10 кВт. Проверьте, выключены ли чайный аппарат и печь."],
  "Check the equipment connected to Phase A on site.": ["Faza A-ya bağlı avadanlıqları yerində yoxlayın.", "Проверьте на месте оборудование, подключённое к фазе A."],
  "If the load continues, ask a qualified electrician to inspect the circuit.": ["Yük davam edərsə ixtisaslı elektrikçidən xətti yoxlamasını istəyin.", "Если нагрузка сохранится, попросите квалифицированного электрика проверить линию."],
  "No problem detected.": ["Problem aşkarlanmayıb.", "Проблем не обнаружено."],
  "Recommendation: delay the oven by 15 minutes.": ["Tövsiyə: sobanı 15 dəqiqə gecikdirin.", "Рекомендация: отложите включение печи на 15 минут."],
  "It is 4.8× higher than the nighttime baseline.": ["Gecə bazasından 4.8× yüksəkdir.", "Это в 4,8 раза выше ночного базового уровня."],
  "Check the facility.": ["Obyekti yoxlayın.", "Проверьте объект."],
  "Open the real Grafana dashboard": ["Real Grafana dashboardunu aç", "Открыть реальный дашборд Grafana"],
  "The real Grafana link will be activated after setup is complete.": ["Real Grafana keçidi qurulum tamamlandıqdan sonra aktiv olacaq.", "Ссылка на реальный Grafana активируется после завершения настройки."],
  "Edit customer": ["MÜŞTƏRİ REDAKTƏSİ", "РЕДАКТИРОВАНИЕ КЛИЕНТА"],
  "Update the facility, Shelly and Telegram information securely.": ["Obyekt, Shelly və Telegram məlumatlarını təhlükəsiz şəkildə yenilə.", "Безопасно обновите данные объекта, Shelly и Telegram."],
  "Customer slug — cannot be changed": ["Müştəri slug — dəyişdirilmir", "Slug клиента — изменить нельзя"],
  "Telegram notifications": ["Telegram bildirişləri", "Уведомления Telegram"],
  "Change the bot, automatic report times and phase names here.": ["Bot, avtomatik report saatları və faza adlarını buradan dəyiş.", "Здесь можно изменить бота, время автоматических отчётов и названия фаз."],
  "Activate commands": ["Komandaları aktiv et", "Активировать команды"],
  "Send report": ["Hesabat göndər", "Отправить отчёт"],
  "Peak test": ["Pik testi", "Тест пика"],
  "Anomaly test": ["Anomaliya testi", "Тест аномалии"],
  "AI analysis uses this profile together with energy measurements.": ["AI analizi bu profili enerji göstəriciləri ilə birlikdə istifadə edir.", "ИИ использует этот профиль вместе с показателями энергопотребления."],
  "Do not enter passwords, tokens or personal information.": ["Parol, token və şəxsi məlumat yazmayın.", "Не вводите пароли, токены или персональные данные."],
  "Changes are stored in an encrypted vault.": ["Dəyişikliklər şifrələnmiş seyfdə saxlanır.", "Изменения хранятся в зашифрованном хранилище."],
  "Save changes": ["Dəyişiklikləri saxla", "Сохранить изменения"],
  "Saving...": ["Saxlanır...", "Сохранение..."],
  "Back to customer list": ["Müştəri siyahısına qayıt", "Вернуться к списку клиентов"],
  "Customer information is being opened securely": ["Müştəri məlumatları təhlükəsiz şəkildə açılır", "Данные клиента безопасно загружаются"],
  "Demo information saved": ["Demo məlumatları saxlandı", "Демо-данные сохранены"],
  "Update added to queue": ["Yenilənmə növbəyə əlavə edildi", "Обновление добавлено в очередь"],
  "These changes apply only to the test account.": ["Bu dəyişikliklər yalnız test hesabına aiddir.", "Эти изменения относятся только к тестовой учётной записи."],
  "The local system will apply the new information and restart the services.": ["Lokal sistem yeni məlumatları tətbiq edib xidmətləri yenidən başladacaq.", "Локальная система применит новые данные и перезапустит службы."],
});

const reverse = new Map<string, string>();
Object.entries(copy).forEach(([en, [a, r]]) => {
  reverse.set(a, en);
  reverse.set(r, en);
});
const C = createContext<{
  language: Language;
  setLanguage: (x: Language) => void;
}>({ language: "az", setLanguage: () => {} });
function tx(value: string, language: Language) {
  const l = value.match(/^\s*/)?.[0] ?? "",
    r = value.match(/\s*$/)?.[0] ?? "",
    raw = value.trim();
  if (!raw) return value;
  const prefixes = {
    az: { dashboard: "Müştəri dashboardu", phase: "Faza", report: "Avtomatik report", times: "dəfə" },
    en: { dashboard: "Customer dashboard", phase: "Phase", report: "Automatic report", times: "times" },
    ru: { dashboard: "Дашборд клиента", phase: "Фаза", report: "Автоматический отчёт", times: "раз" },
  }[language];
  const dashboardMatch = raw.match(/^(?:Müştəri dashboardu|Customer dashboard|Дашборд клиента) · (.+)$/);
  if (dashboardMatch) return `${l}${prefixes.dashboard} · ${dashboardMatch[1]}${r}`;
  const phaseMatch = raw.match(/^(?:Faza|Phase|Фаза) ([ABC]) — (.+)$/);
  if (phaseMatch) return `${l}${prefixes.phase} ${phaseMatch[1]} — ${phaseMatch[2]}${r}`;
  const reportMatch = raw.match(/^(?:Avtomatik report|Automatic report|Автоматический отчёт) (\d+) — (?:saat|time|время)$/);
  if (reportMatch) return `${l}${prefixes.report} ${reportMatch[1]} — ${language === "az" ? "saat" : language === "en" ? "time" : "время"}${r}`;
  const countMatch = raw.match(/^(\d+) (?:dəfə|times|раз)$/);
  if (countMatch) return `${l}${countMatch[1]} ${prefixes.times}${r}`;
  const demoDateMatch = raw.match(/^(?:(\d{4}-\d{2}-\d{2}) tarixi üçün yaradılmış realist nümunə məlumatlarıdır\. Sabah avtomatik yenilənəcək\.|Realistic sample data generated for (\d{4}-\d{2}-\d{2})\. It will update automatically tomorrow\.|Реалистичные тестовые данные созданы для (\d{4}-\d{2}-\d{2})\. Завтра они обновятся автоматически\.)$/);
  if (demoDateMatch) {
    const date = demoDateMatch[1] ?? demoDateMatch[2] ?? demoDateMatch[3];
    const messages = {
      az: `${date} tarixi üçün yaradılmış realist nümunə məlumatlarıdır. Sabah avtomatik yenilənəcək.`,
      en: `Realistic sample data generated for ${date}. It will update automatically tomorrow.`,
      ru: `Реалистичные тестовые данные созданы для ${date}. Завтра они обновятся автоматически.`,
    };
    return l + messages[language] + r;
  }
  if (raw.includes("\n")) {
    const labels: Record<Language, Record<string, string>> = {
      az: { "Tarix:": "Tarix:", "Hazırkı güc:": "Hazırkı güc:", "Bugünkü enerji:": "Bugünkü enerji:", "Son gün:": "Son gün:", "Aylıq proqnoz:": "Aylıq proqnoz:", "Faza A:": "Faza A:", "Tövsiyə:": "Tövsiyə:", "Saat:": "Saat:" },
      en: { "Tarix:": "Date:", "Hazırkı güc:": "Current power:", "Bugünkü enerji:": "Today's energy:", "Son gün:": "Last day:", "Aylıq proqnoz:": "Monthly forecast:", "Faza A:": "Phase A:", "Tövsiyə:": "Recommendation:", "Saat:": "Time:" },
      ru: { "Tarix:": "Дата:", "Hazırkı güc:": "Текущая мощность:", "Bugünkü enerji:": "Энергия за сегодня:", "Son gün:": "Последний день:", "Aylıq proqnoz:": "Прогноз на месяц:", "Faza A:": "Фаза A:", "Tövsiyə:": "Рекомендация:", "Saat:": "Время:" },
    };
    let dynamic = raw;
    const sourceLabels = ["Tarix:", "Date:", "Дата:", "Hazırkı güc:", "Current power:", "Текущая мощность:", "Bugünkü enerji:", "Today's energy:", "Энергия за сегодня:", "Son gün:", "Last day:", "Последний день:", "Aylıq proqnoz:", "Monthly forecast:", "Прогноз на месяц:", "Faza A:", "Phase A:", "Фаза A:", "Tövsiyə:", "Recommendation:", "Рекомендация:", "Saat:", "Time:", "Время:"];
    const canonical = ["Tarix:", "Tarix:", "Tarix:", "Hazırkı güc:", "Hazırkı güc:", "Hazırkı güc:", "Bugünkü enerji:", "Bugünkü enerji:", "Bugünkü enerji:", "Son gün:", "Son gün:", "Son gün:", "Aylıq proqnoz:", "Aylıq proqnoz:", "Aylıq proqnoz:", "Faza A:", "Faza A:", "Faza A:", "Tövsiyə:", "Tövsiyə:", "Tövsiyə:", "Saat:", "Saat:", "Saat:"];
    sourceLabels.forEach((source, index) => { dynamic = dynamic.replaceAll(source, labels[language][canonical[index]]); });
    return l + dynamic.split("\n").map(line => tx(line, language).trim()).join("\n") + r;
  }
  const normalized = raw.replaceAll("'", "’");
  const en =
    reverse.get(raw) ??
    reverse.get(normalized) ??
    (copy[raw] ? raw : copy[normalized] ? normalized : raw);
  return (
    l +
    (language === "en" ? en : (copy[en]?.[language === "az" ? 0 : 1] ?? en)) +
    r
  );
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("az");
  useEffect(() => {
    const x = localStorage.getItem("heat-language") as Language;
    if (["en", "az", "ru"].includes(x)) {
      const frame = requestAnimationFrame(() => setLang(x));
      return () => cancelAnimationFrame(frame);
    }
    localStorage.setItem("heat-language", "az");
  }, []);
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    const root = document.querySelector("#heat-site, #admin-portal, #customer-portal");
    if (!root) return;
    const run = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const translated = tx(node.nodeValue, language);
        if (translated !== node.nodeValue) node.nodeValue = translated;
      }
      if (node instanceof HTMLElement) {
        ["placeholder", "aria-label"].forEach((a) => {
          const v = node.getAttribute(a);
          if (v) {
            const translated = tx(v, language);
            if (translated !== v) node.setAttribute(a, translated);
          }
        });
      }
      node.childNodes.forEach(run);
    };
    run(root);
    const o = new MutationObserver((rs) =>
      rs.forEach((x) => {
        if (x.type === "characterData") run(x.target);
        x.addedNodes.forEach(run);
      }),
    );
    o.observe(root, { childList: true, subtree: true, characterData: true });
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
