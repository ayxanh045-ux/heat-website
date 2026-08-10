export const DEMO_CUSTOMER = {
  id: "demo-caspian-coffee",
  customerName: "Caspian Coffee · DEMO",
  siteName: "Nizami filialı",
  deviceName: "Shelly Pro 3EM (virtual)",
  deviceId: "DEMO-3EM-001",
  status: "demo",
  grafanaPort: null,
} as const;

export const DEMO_EDIT_VALUES = {
  customerName: DEMO_CUSTOMER.customerName,
  customerSlug: "demo-caspian-coffee",
  siteName: DEMO_CUSTOMER.siteName,
  deviceName: DEMO_CUSTOMER.deviceName,
  deviceId: "demo3em001",
  deviceModel: "Shelly Pro 3EM",
  timezone: "Asia/Baku",
  collectorMode: "polling" as const,
  shellyServerUri: "https://demo.shelly.cloud",
  shellyCloudAuthKey: "demo-cloud-key-not-real",
  influxOrg: "HEAT",
  influxBucket: "energy",
  influxAdminUsername: "heat-admin",
  influxAdminPassword: "HeatDotdc4539@",
  influxAdminToken: "demo-influx-token-not-real",
  grafanaAdminUsername: "admin",
  grafanaAdminPassword: "HeatDotdc4539#",
  telegramEnabled: false,
  telegramReportCount: 1,
  telegramReportTimes: "09:00",
  phaseALabel: "Zal + Kondisioner",
  phaseBLabel: "Mətbəx",
  phaseCLabel: "İşıqlandırma + Anbar",
};

export function bakuDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function demoDailyMetrics(dateKey = bakuDateKey()) {
  let seed = 2166136261;
  for (const char of dateKey) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const [year, month, day] = dateKey.split("-").map(Number);
  const completedDays = Math.max(1, day - 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totals = Array.from({ length: completedDays }, (_, index) => {
    const weekday = new Date(Date.UTC(year, month - 1, index + 1)).getUTCDay();
    const busyDay = weekday === 5 || weekday === 6 ? 10 : weekday === 0 ? -7 : 0;
    return 78 + busyDay + (random() - 0.5) * 16;
  });
  const latestEnergy = totals.at(-1) ?? 80;
  const actualEnergy = totals.reduce((sum, value) => sum + value, 0);
  const projectedKwh = actualEnergy + latestEnergy * (daysInMonth - completedDays);
  return {
    dateKey,
    powerKw: (5.7 + random() * 1.9).toFixed(2),
    latestEnergyKwh: latestEnergy.toFixed(1),
    actualEnergyKwh: actualEnergy.toFixed(1),
    averageDailyKwh: (actualEnergy / completedDays).toFixed(1),
    completedDays,
    daysInMonth,
    projectedKwh: Math.round(projectedKwh).toLocaleString("en-US"),
    projectedCostAzn: (projectedKwh * 0.11).toFixed(2),
  };
}

export function demoOperationalMetrics(now = new Date()) {
  const dateKey = bakuDateKey(now);
  const daily = demoDailyMetrics(dateKey);
  let seed = 5381;
  for (const char of `${dateKey}-telegram`) seed = Math.imul(seed, 33) ^ char.charCodeAt(0);
  const random = () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now).map((part) => [part.type, part.value]));
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const power = Number(daily.powerKw);
  const shareA = 0.41 + random() * 0.03;
  const shareB = 0.31 + random() * 0.02;
  const phasePowers = [power * shareA, power * shareB, power * (1 - shareA - shareB)];
  const voltages = [228.5 + random() * 3, 229 + random() * 3, 227.8 + random() * 3];
  const latestEnergy = Number(daily.latestEnergyKwh);
  const blockWeights = [0.12, 0.27, 0.39, 0.22];
  const blocks = blockWeights.map((weight) => latestEnergy * weight);
  const phaseEnergy = [latestEnergy * shareA, latestEnergy * shareB, latestEnergy * (1 - shareA - shareB)];
  const previous24h = latestEnergy * (0.94 + random() * 0.09);
  const changePercent = ((latestEnergy - previous24h) / previous24h) * 100;
  const activeHours = Math.max(0, hour + minute / 60 - 7);
  const todayEnergy = Math.min(latestEnergy * 1.08, 2.1 + activeHours * (power * 0.86));
  return {
    ...daily,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    todayEnergyKwh: todayEnergy.toFixed(1),
    phasePowersKw: phasePowers.map((value) => value.toFixed(2)),
    phaseVoltagesV: voltages.map((value) => value.toFixed(1)),
    phaseCurrentsA: phasePowers.map((value, index) => ((value * 1000) / voltages[index]).toFixed(1)),
    phaseEnergyKwh: phaseEnergy.map((value) => value.toFixed(1)),
    phaseSharesPct: phaseEnergy.map((value) => ((value / latestEnergy) * 100).toFixed(1)),
    blockEnergyKwh: blocks.map((value) => value.toFixed(1)),
    averagePowerKw: (latestEnergy / 24).toFixed(2),
    peakPowerKw: (power * (1.52 + random() * 0.12)).toFixed(2),
    peakTime: `${12 + Math.floor(random() * 5)}:${random() > 0.5 ? "15" : "40"}`,
    previous24hKwh: previous24h.toFixed(1),
    changePercent: changePercent.toFixed(1),
    monthActualCostAzn: (Number(daily.actualEnergyKwh) * 0.11).toFixed(2),
    signalDbm: String(-48 - Math.floor(random() * 9)),
    uptimeDays: String(18 + Math.floor(random() * 12)),
  };
}
