export type Ts3Channel = {
  id: string;
  /** Parent channel ID, or "0" for a top-level channel. */
  parentId: string;
  name: string;
};

// A dispatcher on duty is identified either by a callsign like "C-100" /
// "C-303", or by one of the on-duty tags in their display name. Anyone
// matching either pattern should never trigger a pending-call alert.
const CALLSIGN_PATTERN = /\b[CE]-\d+/;
const ON_DUTY_TAG_PATTERN = /\[(P|S|T|FIRE|911|TAC|SA|E)\]/;

export const isDispatcherName = (nickname: string): boolean =>
  CALLSIGN_PATTERN.test(nickname) || ON_DUTY_TAG_PATTERN.test(nickname);

// Regular on-duty unit callsigns (not just dispatchers) look like "3C-132",
// "2L-82", "5N-1151" - an optional 1-2 digit department prefix, 1-4 capital
// letters, a dash, then digits. Civilian names like "Civ-114" deliberately
// don't match this: the lowercase "iv" breaks the required all-caps run
// right before the dash.
const UNIT_CALLSIGN_PATTERN = /\b\d{0,2}[A-Z]{1,4}-\d+/;

export const hasUnitCallsign = (nickname: string): boolean => UNIT_CALLSIGN_PATTERN.test(nickname);

/** True only for people who are neither a dispatcher nor any other on-duty unit. */
export const isCivilianName = (nickname: string): boolean =>
  !isDispatcherName(nickname) && !hasUnitCallsign(nickname);

/** Parses a raw "notifytextmessage" server-pushed event line into sender/message. */
export const parseNotifyTextMessage = (line: string): { sender: string; message: string } | null => {
  const senderMatch = line.match(/invokername=(\S+)/);
  const msgMatch = line.match(/msg=(\S+)/);
  if (!senderMatch || !msgMatch) return null;
  return {
    sender: unescape(senderMatch[1]),
    message: unescape(msgMatch[1]),
  };
};

const unescape = (value: string): string =>
  value.replace(/\\s/g, " ").replace(/\\p/g, "|").replace(/\\\//g, "/").replace(/\\\\/g, "\\");

/** Parses raw "channellist" response lines (pipe-separated entries) into channel id/parent/name triples. */
export const parseChannelList = (dataLines: string[]): Ts3Channel[] => {
  const joined = dataLines.join(" ");
  const entries = joined.split("|");
  const channels: Ts3Channel[] = [];

  for (const entry of entries) {
    const idMatch = entry.match(/(?:^|\s)cid=(\d+)/);
    const pidMatch = entry.match(/(?:^|\s)pid=(\d+)/);
    const nameMatch = entry.match(/channel_name=(\S+)/);
    if (idMatch && nameMatch) {
      channels.push({
        id: idMatch[1],
        parentId: pidMatch?.[1] ?? "0",
        name: unescape(nameMatch[1]),
      });
    }
  }

  return channels;
};

export type Ts3Client = {
  id: string;
  channelId: string;
  nickname: string;
};

/** Parses raw "clientlist" response lines (pipe-separated entries) into client id/channel/nickname triples. */
export const parseClientList = (dataLines: string[]): Ts3Client[] => {
  const joined = dataLines.join(" ");
  const entries = joined.split("|");
  const clients: Ts3Client[] = [];

  for (const entry of entries) {
    const idMatch = entry.match(/(?:^|\s)clid=(\d+)/);
    const cidMatch = entry.match(/(?:^|\s)cid=(\d+)/);
    const nameMatch = entry.match(/client_nickname=(\S+)/);
    if (idMatch && cidMatch && nameMatch) {
      clients.push({ id: idMatch[1], channelId: cidMatch[1], nickname: unescape(nameMatch[1]) });
    }
  }

  return clients;
};
