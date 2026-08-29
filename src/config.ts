import Store from "electron-store";
import locations from "./configs/locations.json";
import postals from "./configs/postals.json";

export const CONFIG_VERSION = "0.2.4";
export const LOCATIONS_VERSION = "0.2.4";
export const POSTALS_VERSION = "0.3.2";
export const SETTINGS_VERSION = "1.6.3";

export type ConfigSchemaType = {
  config: ConfigType;
  version: string;
};

export type ConfigType = {
  frequencies: FrequencyConfig[];
  icons: IconConfig[];
};

export type LocationsSchemaType = {
  config: LocationConfig[];
  version: string;
};

export type PostalsSchemaType = {
  config: PostalConfig[];
  version: string;
};

export type SettingsSchemaType = {
  config: SettingsType;
  version: string;
};

export type SettingsType = {
  themeName: string;
  sonoranWebSocketUrl: string;
  frequenciesSection: boolean;
  transmitLogSection: boolean;
  stayOnTop: boolean;
  autoUpdate: boolean;
  timeFormat: "12h" | "24h";
  dateFormat: "MDY" | "DMY";
  showSeconds: boolean;
  showDate: boolean;
  showTimeZone: boolean;
  /** IANA timezone name, or "system" to follow the OS default. */
  timeZone: string;
  /** When true, event log only shows activity from your tuned or scanned channels. */
  rtoFilterEnabled: boolean;
  /** Optional custom audio file paths for pending-call alerts, one per channel. Empty means use the default beep. */
  soundFileLosSantos911: string;
  soundFileLosSantos311: string;
  soundFileBlaineCounty911: string;
  soundFileBlaineCounty311: string;
  soundFilePriority911: string;
  /** Alert tone volume, 0-100. */
  alertVolume: number;
  showEventLogTime: boolean;
  showEventLogChannel: boolean;
  showEventLogIdentifier: boolean;
  showEventLogLocation: boolean;
  ts3ClientQueryApiKey: string;
  /** Message sent when using Call Trace on an active caller. */
  callTraceMessage: string;
  /** Message sent when requesting a callback from a Civ Group civilian. */
  requestCallbackMessage: string;
  /** Incoming messages from this sender name never trigger the popup (e.g. an automated 911 bot). */
  ignoredMessageSender: string;
  /** One profile per patrol server, identified at runtime by matching rtoChannelId
   * against the currently-connected server's channel list. All values are raw
   * TeamSpeak channel IDs (stable even if a channel's display name changes,
   * e.g. from a queue-count suffix) rather than names. */
  ts3ServerProfiles: Ts3ServerProfile[];
};

export type Ts3ServerProfile = {
  label: string;
  /** The parent group channel that contains this server's RTO channel.
   * If provided, used directly for section detection (faster and slightly
   * more robust than deriving it from the RTO channel's parent at runtime). */
  groupChannelId?: string;
  rtoChannelId: string;
  /** Where civilians sit when not actively in a 911/311/Priority call. */
  civilianChannelId?: string;
  losSantos911: string;
  losSantos311: string;
  blaineCounty911: string;
  blaineCounty311: string;
  priority911: string;
};

/** Common category values with built-in colors: POLICE, TACTICAL, FIRE/EMS, INTEROP, SERVICE.
 * Any other text is accepted too and will display with a neutral color. */
export type ChannelCategory = string;

export type FrequencyConfig = {
  name: string;
  xmit: [number, number];
  recv: [number, number];
  /** Optional display-only talkgroup label, e.g. "TG 101". Purely cosmetic. */
  tg?: string;
  /** Optional category used to color-code the channel tile. Defaults to "other". */
  category?: ChannelCategory;
  /** Optional short description shown in the selected-channel detail panel. */
  description?: string;
};

export type LocationConfig = {
  name: string;
  x: number;
  y: number;
};

export type PostalConfig = {
  label: string;
  x: number;
  y: number;
};

export type IconConfig = {
  match: string;
  department: string;
};

const configStore = new Store<ConfigSchemaType>({
  name: "config",
  defaults: {
    version: CONFIG_VERSION,
    config: {
      frequencies: [],
      icons: [],
    },
  },
});

const locationsStore = new Store<LocationsSchemaType>({
  name: "locations",
  defaults: locations,
});

const postalStore = new Store<PostalsSchemaType>({
  name: "postals",
  defaults: postals,
});

export const DEFAULT_SETTINGS: SettingsType = {
  themeName: "navy",
  sonoranWebSocketUrl: "ws://[::1]:33802",
  frequenciesSection: true,
  transmitLogSection: true,
  stayOnTop: false,
  autoUpdate: true,
  timeFormat: "24h",
  dateFormat: "MDY",
  showSeconds: true,
  showDate: true,
  showTimeZone: true,
  timeZone: "system",
  rtoFilterEnabled: true,
  soundFileLosSantos911: "",
  soundFileLosSantos311: "",
  soundFileBlaineCounty911: "",
  soundFileBlaineCounty311: "",
  soundFilePriority911: "",
  alertVolume: 100,
  showEventLogTime: true,
  showEventLogChannel: true,
  showEventLogIdentifier: true,
  showEventLogLocation: true,
  ts3ClientQueryApiKey: "",
  callTraceMessage: "** CALL TRACE **",
  requestCallbackMessage: "** REQUEST CALLBACK **",
  ignoredMessageSender: "911 Bot",
  ts3ServerProfiles: [
    {
      label: "Server 1",
      groupChannelId: "26119",
      rtoChannelId: "26125",
      civilianChannelId: "26134",
      losSantos911: "26130",
      losSantos311: "26131",
      blaineCounty911: "26127",
      blaineCounty311: "26128",
      priority911: "26132",
    },
    {
      label: "Server 2",
      groupChannelId: "3187",
      rtoChannelId: "3194",
      civilianChannelId: "3199",
      losSantos911: "13625",
      losSantos311: "13624",
      blaineCounty911: "3195",
      blaineCounty311: "3196",
      priority911: "3197",
    },
    {
      label: "Server 3",
      groupChannelId: "26860",
      rtoChannelId: "26867",
      civilianChannelId: "26876",
      losSantos911: "26872",
      losSantos311: "26873",
      blaineCounty911: "26869",
      blaineCounty311: "26870",
      priority911: "26874",
    },
  ],
};

const settingsStore = new Store<SettingsSchemaType>({
  name: "settings",
  defaults: {
    version: SETTINGS_VERSION,
    config: DEFAULT_SETTINGS,
  },
});

export { configStore, locationsStore, postalStore, settingsStore };
