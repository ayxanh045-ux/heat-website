export function localDateAndTime(now: Date, timezone: string): { date: string; time: string } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function scheduledDeliveryKey(customerId: string, date: string, time: string): string {
  return `${customerId}:${date}:${time}`;
}

export function dueScheduledTime(currentTime: string, reportTimes: string[], graceMinutes = 10): string | null {
  const [hour, minute] = currentTime.split(":").map(Number);
  const currentMinutes = hour * 60 + minute;
  let nearest: { time: string; delay: number } | null = null;
  for (const time of reportTimes) {
    const [scheduledHour, scheduledMinute] = time.split(":").map(Number);
    const delay = currentMinutes - (scheduledHour * 60 + scheduledMinute);
    if (delay < 0 || delay > graceMinutes) continue;
    if (!nearest || delay < nearest.delay) nearest = { time, delay };
  }
  return nearest?.time ?? null;
}
