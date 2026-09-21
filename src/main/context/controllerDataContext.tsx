import * as React from "react";
import useSonoranWebSocket from "../hooks/useSonoranWebSocket";
import { Controller, Frequency } from "./sonoranWebSocketContext";

export type UnitLog = {
  id: number;
  nickname: string;
  can_hear: boolean;
  active: boolean;
  xmit: Frequency;
  recv: Frequency;
  game?: { x: number; y: number };
  timestamp: string;
};

type ControllerData = {
  self: Controller | null;
  units: Controller["channel_clients"];
  logs: UnitLog[];
  connected: boolean;
};

export const ControllerDataContext = React.createContext<ControllerData>({
  self: null,
  units: [],
  logs: [],
  connected: false,
});

const REFRESH_INTERVAL_MS = 8000;

export const ControllerDataProvider = (props: React.PropsWithChildren) => {
  const sonoranWebSocket = useSonoranWebSocket();
  const [self, setSelf] = React.useState<Controller | null>(null);
  const [logs, setLogs] = React.useState<UnitLog[]>([]);
  const [connected, setConnected] = React.useState(false);

  const applyControllers = React.useCallback((data: Controller[]) => {
    if (!data || data.length === 0) return;
    const candidate = data[0];
    // Guard against ever applying malformed data (e.g. from an unconfirmed
    // event shape) - a real Controller always has a channel_clients array.
    if (!candidate || !Array.isArray((candidate as any).channel_clients)) return;
    setSelf(candidate);
  }, []);

  React.useEffect(() => {
    if (!sonoranWebSocket) return;

    const onOpen = () => setConnected(true);
    const onClose = () => setConnected(false);

    const onMessage = (event: MessageEvent) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "recv_controllers":
          applyControllers(data.data);
          break;

        case "channel_clients_changed":
          // This event's real payload shape was never confirmed live, so
          // rather than risk applying malformed data (which briefly
          // corrupted "self" and dropped the online count to 0), always
          // just request a fresh, reliable snapshot instead.
          sonoranWebSocket.send(JSON.stringify({ type: "get_controllers" }));
          break;

        case "frequencies_updated":
          setSelf((prev) =>
            prev
              ? {
                  ...prev,
                  state: {
                    ...prev.state,
                    freq_recv: data.freq_recv,
                    freq_xmit: data.freq_xmit,
                  },
                }
              : prev
          );
          break;

        case "frequencies_scanned_updated":
          setSelf((prev) =>
            prev
              ? {
                  ...prev,
                  state: {
                    ...prev.state,
                    freq_scan: data.freqs,
                    enable_scan: data.enabled,
                  },
                }
              : prev
          );
          break;

        case "client_xmit_change":
          if (data.xmit_type === "unit_talk_permit") {
            const date = new Date();
            const newLog: UnitLog = {
              id: data.client.id,
              nickname: data.client.nickname,
              can_hear: data.can_hear,
              active: true,
              xmit: data.client.state.freq_xmit,
              recv: data.client.state.freq_recv,
              game: data.client.state.game
                ? { x: data.client.state.game.position[0], y: data.client.state.game.position[1] }
                : undefined,
              timestamp: `${("0" + date.getUTCHours()).slice(-2)}:${(
                "0" + date.getUTCMinutes()
              ).slice(-2)}z`,
            };
            setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
          } else if (data.xmit_type === "unit_squelch") {
            setLogs((prev) =>
              prev.map((log) => (log.id === data.client.id ? { ...log, active: false } : log))
            );
          }
          break;

        default:
          break;
      }
    };

    sonoranWebSocket.addEventListener("open", onOpen);
    sonoranWebSocket.addEventListener("close", onClose);
    sonoranWebSocket.addEventListener("message", onMessage);

    if (sonoranWebSocket.readyState === WebSocket.OPEN) {
      setConnected(true);
    }

    return () => {
      sonoranWebSocket.removeEventListener("open", onOpen);
      sonoranWebSocket.removeEventListener("close", onClose);
      sonoranWebSocket.removeEventListener("message", onMessage);
    };
  }, [sonoranWebSocket, applyControllers]);

  React.useEffect(() => {
    if (!sonoranWebSocket) return;
    const interval = setInterval(() => {
      if (sonoranWebSocket.readyState === WebSocket.OPEN) {
        sonoranWebSocket.send(JSON.stringify({ type: "get_controllers" }));
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sonoranWebSocket]);

  return (
    <ControllerDataContext.Provider value={{ self, units: self?.channel_clients ?? [], logs, connected }}>
      {props.children}
    </ControllerDataContext.Provider>
  );
};
