import { SettingsType } from "../../config";

const resolveTimeZone = (timeZone: string): string | undefined =>
  timeZone === "system" ? undefined : timeZone;

export const listAvailableTimeZones = (): string[] => [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export const formatClockTime = (
  date: Date,
  settings: Pick<SettingsType, "timeFormat" | "showSeconds" | "timeZone">
): string => {
  return date.toLocaleTimeString([], {
    timeZone: resolveTimeZone(settings.timeZone),
    hour12: settings.timeFormat === "12h",
    hour: "2-digit",
    minute: "2-digit",
    second: settings.showSeconds ? "2-digit" : undefined,
  });
};

export const formatClockDate = (
  date: Date,
  settings: Pick<SettingsType, "dateFormat" | "timeZone">
): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(settings.timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const month = get("month");
  const day = get("day");
  const year = get("year");

  return settings.dateFormat === "DMY" ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
};

export const formatTimeZoneLabel = (
  date: Date,
  settings: Pick<SettingsType, "timeZone">
): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: resolveTimeZone(settings.timeZone),
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
};

/** Event log timestamps only respect showSeconds + timeFormat, using UTC (Zulu) time. */
export const formatEventLogTimestamp = (
  date: Date,
  settings: Pick<SettingsType, "timeFormat" | "showSeconds">
): string => {
  let hours = date.getUTCHours();
  const minutes = ("0" + date.getUTCMinutes()).slice(-2);
  const seconds = ("0" + date.getUTCSeconds()).slice(-2);

  if (settings.timeFormat === "12h") {
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hh = ("0" + hours).slice(-2);
    return settings.showSeconds ? `${hh}:${minutes}:${seconds} ${suffix}` : `${hh}:${minutes} ${suffix}`;
  }

  const hh = ("0" + hours).slice(-2);
  return settings.showSeconds ? `${hh}:${minutes}:${seconds}z` : `${hh}:${minutes}z`;
};
