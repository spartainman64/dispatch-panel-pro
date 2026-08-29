// TeamSpeak 3 exposes a first-party, documented local interface called
// ClientQuery (enable via TS3 Settings -> Addons -> Plugins -> ClientQuery).
// It's a plain-text, line-based protocol over a local TCP socket on
// 127.0.0.1:25639 by default. This is a completely separate system from
// SonoranRadio's WebSocket bridge - this one only knows about TeamSpeak
// channels and clients, nothing about radio frequencies.
//
// Protocol basics:
//   - Connect via TCP to 127.0.0.1:25639
//   - Authenticate: "auth apikey=<key>\n\r" (the key is generated inside
//     TeamSpeak's ClientQuery settings screen)
//   - Every command's response ends with a line like "error id=0 msg=ok"
//     (id=0 means success; any other id is a failure, with msg describing why)
//   - Spaces inside response values are escaped as "\s"

import * as net from "net";
import {
  parseChannelList,
  parseClientList,
  isDispatcherName,
  Ts3Channel,
} from "./shared/utils/ts3ChannelList";
import { Ts3ServerProfile } from "./config";

const HOST = "127.0.0.1";
const PORT = 25639;

type CommandResult = {
  success: boolean;
  message: string;
  data: string[];
};

class TS3ClientQuery {
  private socket: net.Socket | null = null;
  private buffer = "";
  private queue: Array<(result: CommandResult) => void> = [];
  private pendingLines: string[] = [];
  private connected = false;
  private connecting: Promise<void> | null = null;
  private apiKey: string;

  /**
   * Called for every unsolicited "notify..." line pushed by the server
   * (e.g. incoming text messages), which can arrive at any time - not just
   * as a response to a command we sent. These must never be routed into
   * the normal command/response queue, or they'd corrupt whatever command
   * happens to be in flight at that moment.
   */
  onNotification: ((line: string) => void) | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private ensureConnected(): Promise<void> {
    if (this.connected && this.socket) return Promise.resolve();
    if (this.connecting) return this.connecting;

    this.connecting = new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: HOST, port: PORT });

      const onError = (err: Error) => {
        this.connected = false;
        this.connecting = null;
        socket.removeAllListeners();
        reject(err);
      };

      socket.once("error", onError);

      socket.on("connect", () => {
        this.socket = socket;
        socket.off("error", onError);
        socket.on("error", () => {
          this.connected = false;
        });
        socket.on("close", () => {
          this.connected = false;
          this.socket = null;
          this.flushQueueWithFailure("Connection to TeamSpeak closed");
        });
        socket.on("data", (chunk) => this.onData(chunk.toString("utf8")));

        this.sendRaw(`auth apikey=${this.apiKey}`)
          .then((res) => {
            if (res.success) {
              this.connected = true;
              this.connecting = null;
              // Subscribe to incoming private text messages. Whether TS3
              // also forwards incoming pokes through ClientQuery isn't
              // confirmed - this is the one thing in this file that needs
              // live testing to verify.
              this.sendRaw("clientnotifyregister schandlerid=0 event=notifytextmessage")
                .then((res) => {
                  console.log(
                    `[TS3] Notification registration ${res.success ? "succeeded" : "FAILED"}:`,
                    res.success ? "ok" : res.message
                  );
                })
                .catch((err) => {
                  console.error("[TS3] Notification registration threw:", err);
                });
              resolve();
            } else {
              this.connecting = null;
              reject(new Error(res.message || "Authentication failed"));
            }
          })
          .catch((err) => {
            this.connecting = null;
            reject(err);
          });
      });
    });

    return this.connecting;
  }

  private onData(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "") continue;
      // Ignore the client's welcome banner lines.
      if (line.startsWith("TS3 Client") || line.startsWith("Welcome to")) continue;

      // Unsolicited server-pushed events (e.g. "notifytextmessage ...") can
      // arrive at any time, not just as a response to something we sent -
      // route these separately so they never get mistaken for the next
      // queued command's response data.
      if (/^notify\w+/.test(line)) {
        this.onNotification?.(line);
        continue;
      }

      if (line.startsWith("error ")) {
        const idMatch = line.match(/id=(\d+)/);
        const msgMatch = line.match(/msg=(\S+)/);
        const success = idMatch?.[1] === "0";
        const message = (msgMatch?.[1] ?? "").replace(/\\s/g, " ");
        const data = this.pendingLines;
        this.pendingLines = [];
        const resolve = this.queue.shift();
        resolve?.({ success, message, data });
      } else {
        this.pendingLines.push(line);
      }
    }
  }

  private sendRaw(command: string): Promise<CommandResult> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.socket?.write(command + "\n\r");
    });
  }

  async send(command: string): Promise<CommandResult> {
    await this.ensureConnected();
    const result = await this.sendRaw(command);
    if (!result.success) {
      // A failed command (even one that returned an error response rather
      // than a hard socket error) can mean the session with ClientQuery has
      // gone stale for a reason we can't always detect directly. Drop the
      // connection so the *next* command starts with a completely fresh
      // connect + re-auth, instead of repeating the same failure forever.
      this.disconnect();
    }
    return result;
  }

  /** Returns the local client's own TeamSpeak client ID (clid). */
  async getOwnClientId(): Promise<string | null> {
    const whoami = await this.send("whoami");
    if (!whoami.success) return null;
    const match = whoami.data.join(" ").match(/clid=(\d+)/);
    return match?.[1] ?? null;
  }

  /** Moves the local TeamSpeak client into the given channel by its channel ID. */
  async moveToChannel(channelId: string): Promise<CommandResult> {
    const clid = await this.getOwnClientId();
    if (!clid) {
      return { success: false, message: "Could not determine own TeamSpeak client ID", data: [] };
    }
    return this.send(`clientmove cid=${channelId} clid=${clid}`);
  }

  /** Raw "whoami" response, exposed for diagnostics. */
  async whoami(): Promise<CommandResult> {
    return this.send("whoami");
  }

  /**
   * Returns the channel ID the local client is currently sitting in.
   */
  async getCurrentChannelId(): Promise<string | null> {
    const whoami = await this.send("whoami");
    if (!whoami.success) return null;
    const match = whoami.data.join(" ").match(/(?:^|\s)cid=(\d+)/);
    return match?.[1] ?? null;
  }

  /**
   * Moves into the target channel for a given button (e.g. "losSantos911"),
   * automatically figuring out which saved profile (patrol section) applies.
   * Since all sections live on the same single TeamSpeak server, this can't
   * use server identity to tell them apart. Instead, for each profile it
   * finds the parent group that directly contains that profile's RTO
   * channel, then checks whether the dispatcher's current channel is that
   * group itself or nested anywhere inside it. This is deliberately scoped
   * to each RTO channel's own immediate parent group rather than walking
   * all the way to the absolute top-level channel, since a shared wrapper
   * category above all three patrol groups would otherwise make every
   * section look identical at the very top.
   */
  private async resolveMyProfile(
    channels: Ts3Channel[],
    profiles: Ts3ServerProfile[]
  ): Promise<{ profile: Ts3ServerProfile; myChannelId: string } | { profile: null; myChannelId: string | null }> {
    const isInGroup = (startChannelId: string, groupId: string): boolean => {
      let current = channels.find((c) => c.id === startChannelId);
      const visited = new Set<string>();
      while (current) {
        if (current.id === groupId) return true;
        if (visited.has(current.id)) break;
        visited.add(current.id);
        if (current.parentId === "0") break;
        current = channels.find((c) => c.id === current!.parentId);
      }
      return false;
    };

    const myChannelId = await this.getCurrentChannelId();

    let matchingProfile: Ts3ServerProfile | undefined;
    if (myChannelId) {
      matchingProfile = profiles.find((p) => {
        const groupId = p.groupChannelId || channels.find((c) => c.id === p.rtoChannelId)?.parentId;
        return !!groupId && isInGroup(myChannelId, groupId);
      });
    }

    // Fallback: exact match against the current channel.
    if (!matchingProfile && myChannelId) {
      matchingProfile = profiles.find((p) => p.rtoChannelId === myChannelId);
    }

    if (!matchingProfile) return { profile: null, myChannelId };
    return { profile: matchingProfile, myChannelId };
  }

  async moveToButtonTarget(
    buttonKey: keyof Omit<Ts3ServerProfile, "label" | "rtoChannelId"> | "rto",
    profiles: Ts3ServerProfile[]
  ): Promise<CommandResult> {
    const list = await this.listChannels();
    if (!list.success) return list;
    const channels = parseChannelList(list.data);

    const { profile: matchingProfile, myChannelId } = await this.resolveMyProfile(channels, profiles);

    if (!matchingProfile) {
      const whoamiRaw = await this.whoami();
      return {
        success: false,
        message: `Could not determine which patrol section you're in (detected channel id: ${myChannelId ?? "none"})`,
        data: whoamiRaw.data,
      };
    }

    const targetId = buttonKey === "rto" ? matchingProfile.rtoChannelId : matchingProfile[buttonKey];
    if (!targetId) {
      return {
        success: false,
        message: `No channel configured for this button on "${matchingProfile.label}"`,
        data: [],
      };
    }

    return this.moveToChannel(targetId);
  }

  /**
   * Moves ANOTHER connected client (e.g. a civilian caller) into one of
   * your patrol section's call channels, or back to the patrol group
   * ("release"). This uses TeamSpeak's own clientmove command, which - per
   * server permissions - can target any client, not just yourself. This is
   * a genuinely different capability from SonoranRadio's local WS API,
   * which had no way to control anyone but the local player.
   */
  async moveClientToButtonTarget(
    targetClientId: string,
    buttonKey: keyof Omit<Ts3ServerProfile, "label" | "rtoChannelId"> | "rto" | "release",
    profiles: Ts3ServerProfile[]
  ): Promise<CommandResult> {
    const list = await this.listChannels();
    if (!list.success) return list;
    const channels = parseChannelList(list.data);

    const { profile: matchingProfile, myChannelId } = await this.resolveMyProfile(channels, profiles);

    if (!matchingProfile) {
      return {
        success: false,
        message: `Could not determine which patrol section you're in (detected channel id: ${myChannelId ?? "none"})`,
        data: [],
      };
    }

    const targetId =
      buttonKey === "rto"
        ? matchingProfile.rtoChannelId
        : buttonKey === "release"
        ? matchingProfile.civilianChannelId
        : matchingProfile[buttonKey];

    if (!targetId) {
      return {
        success: false,
        message: `No channel configured for this option on "${matchingProfile.label}"`,
        data: [],
      };
    }

    return this.send(`clientmove cid=${targetId} clid=${targetClientId}`);
  }

  /**
   * Returns every connected non-dispatcher client, with their current
   * channel name attached - the full available-civilians roster.
   */
  /**
   * Returns everyone currently sitting in the current server's Civ Group
   * (waiting) channel - these are the people actually available to pull
   * into a call. No longer filters by name pattern: civilian names vary
   * too much to pattern-match reliably, and PD/FD admins sometimes
   * deliberately sit in this channel to simulate a caller - so channel
   * membership itself is the real signal, not the name.
   */
  async getAllCivilians(
    profiles: Ts3ServerProfile[]
  ): Promise<{ id: string; nickname: string; channelName: string }[]> {
    const [clientListResult, channelListResult] = await Promise.all([
      this.send("clientlist"),
      this.send("channellist"),
    ]);
    if (!clientListResult.success) return [];

    const clients = parseClientList(clientListResult.data);
    const channels = channelListResult.success ? parseChannelList(channelListResult.data) : [];
    const channelName = (id: string) => channels.find((c) => c.id === id)?.name ?? "Unknown";

    const { profile } = await this.resolveMyProfile(channels, profiles);
    if (!profile?.civilianChannelId) return [];

    return clients
      .filter((c) => c.channelId === profile.civilianChannelId)
      .map((c) => ({ id: c.id, nickname: c.nickname, channelName: channelName(c.channelId) }));
  }

  private escapeTs3(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/\//g, "\\/")
      .replace(/\s/g, "\\s")
      .replace(/\|/g, "\\p");
  }

  /** Sends a TeamSpeak "poke" (attention popup) with a message to a specific client. */
  async pokeClient(clientId: string, message: string): Promise<CommandResult> {
    return this.send(`clientpoke clid=${clientId} msg=${this.escapeTs3(message)}`);
  }

  /**
   * Figures out what the dispatcher's current channel represents: sitting
   * in an RTO channel, sitting in a 911/311/Priority call channel (with a
   * live list of who else is in there, excluding dispatchers), or neither.
   */
  async getCallerContext(
    profiles: Ts3ServerProfile[]
  ): Promise<{
    status: "rto" | "call" | "other";
    label: string;
    callers: { id: string; nickname: string }[];
  }> {
    const list = await this.listChannels();
    if (!list.success) return { status: "other", label: "", callers: [] };
    const channels = parseChannelList(list.data);

    const { profile, myChannelId } = await this.resolveMyProfile(channels, profiles);
    if (!profile) return { status: "other", label: "", callers: [] };

    if (profile.rtoChannelId && profile.rtoChannelId === myChannelId) {
      return { status: "rto", label: `RTO \u2014 ${profile.label}`, callers: [] };
    }

    const CALL_CHANNEL_FIELDS: Array<{
      key: keyof Omit<Ts3ServerProfile, "label" | "rtoChannelId" | "groupChannelId" | "civilianChannelId">;
      label: string;
    }> = [
      { key: "losSantos911", label: "Los Santos 911" },
      { key: "blaineCounty911", label: "Blaine County 911" },
      { key: "losSantos311", label: "Los Santos 311" },
      { key: "blaineCounty311", label: "Blaine County 311" },
      { key: "priority911", label: "Priority 911" },
    ];

    for (const field of CALL_CHANNEL_FIELDS) {
      const channelId = profile[field.key];
      if (channelId && channelId === myChannelId) {
        const clientListResult = await this.send("clientlist");
        const clients = clientListResult.success ? parseClientList(clientListResult.data) : [];
        const callers = clients
          .filter((c) => c.channelId === channelId && !isDispatcherName(c.nickname))
          .map((c) => ({ id: c.id, nickname: c.nickname }));
        return { status: "call", label: field.label, callers };
      }
    }

    return { status: "other", label: "", callers: [] };
  }

  /** Raw parsed clientlist, for diagnostics - shows every connected client and their channel id. */
  async getRawClientList(): Promise<{ id: string; channelId: string; nickname: string }[]> {
    const result = await this.send("clientlist");
    if (!result.success) return [];
    return parseClientList(result.data);
  }

  /** Returns the raw channellist response lines, for discovering channel IDs/names. */
  async listChannels(): Promise<CommandResult> {
    return this.send("channellist");
  }

  /**
   * Counts how many non-dispatcher clients are currently sitting in each of
   * the 911/311/Priority target channels, summed across all saved server
   * profiles (since a shared server means only one profile's channel will
   * ever actually have anyone in it at a time, but all are checked to be
   * safe). Dispatchers (identified by callsign or on-duty tag) never count.
   * Also reports, per channel, whether another dispatcher (not the local
   * client) is present - used to auto-clear a flashing alert once someone
   * else has clearly stepped in to handle it.
   */
  async getPendingCounts(
    profiles: Ts3ServerProfile[]
  ): Promise<{ counts: Record<string, number>; dispatcherPresent: Record<string, boolean> }> {
    const keys: Array<keyof Omit<Ts3ServerProfile, "label" | "rtoChannelId" | "groupChannelId">> = [
      "losSantos911",
      "losSantos311",
      "blaineCounty911",
      "blaineCounty311",
      "priority911",
    ];

    const counts: Record<string, number> = {};
    const dispatcherPresent: Record<string, boolean> = {};
    for (const key of keys) {
      counts[key] = 0;
      dispatcherPresent[key] = false;
    }

    const clientListResult = await this.send("clientlist");
    if (!clientListResult.success) {
      console.error("[TS3] clientlist command failed:", clientListResult.message);
      return { counts, dispatcherPresent };
    }

    const clients = parseClientList(clientListResult.data);
    const ownClientId = await this.getOwnClientId();

    for (const profile of profiles) {
      for (const key of keys) {
        const channelId = profile[key];
        if (!channelId) continue;
        const inChannel = clients.filter((c) => c.channelId === channelId);
        const waiting = inChannel.filter((c) => !isDispatcherName(c.nickname));
        counts[key] += waiting.length;
        const otherDispatcher = inChannel.some(
          (c) => isDispatcherName(c.nickname) && c.id !== ownClientId
        );
        if (otherDispatcher) dispatcherPresent[key] = true;
      }
    }

    return { counts, dispatcherPresent };
  }

  disconnect() {
    this.socket?.destroy();
    this.socket = null;
    this.connected = false;
    this.flushQueueWithFailure("Connection to TeamSpeak was reset");
  }

  /** Resolves any commands still waiting for a response with a failure,
   * instead of leaving them hanging forever when the connection drops. */
  private flushQueueWithFailure(message: string) {
    const pending = this.queue;
    this.queue = [];
    this.pendingLines = [];
    for (const resolve of pending) {
      resolve({ success: false, message, data: [] });
    }
  }
}

export default TS3ClientQuery;
