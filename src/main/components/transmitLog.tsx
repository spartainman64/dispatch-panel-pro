import * as React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import useSonoranWebSocket from "../hooks/useSonoranWebSocket";
import useControllerData from "../hooks/useControllerData";
import useStore from "../../shared/hooks/useStore";
import { formatEventLogTimestamp } from "../utils/dateTimeFormat";

export type Log = {
  id: number;
  nickname: string;
  can_hear: boolean;
  active: boolean;
  xmit: Array<number>;
  recv: Array<number>;
  /** Whether this transmission was on the dispatcher's main/tuned channel or a scanned one, at the time it started. */
  channelKind: "main" | "scanned" | "other";
  game?: Game;
  timestamp: Date;
};

export type Game = {
  x: number;
  y: number;
};

export type EventLogVisibility = {
  rtoFilterEnabled: boolean;
  showEventLogTime: boolean;
  showEventLogChannel: boolean;
  showEventLogIdentifier: boolean;
  showEventLogLocation: boolean;
};

type Props = {
  /** When provided, overrides the shared/global settings for filtering and
   * column visibility - used by the standalone popout window so its View
   * toggles are independent of the main window's settings. */
  overrideVisibility?: EventLogVisibility;
};

const sameFreq = (a?: Array<number>, b?: Array<number>) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

const TransmitLog = (props: Props) => {
  const [logs, setLogs] = React.useState<Array<Log>>([]);
  const sonoranWebSocket = useSonoranWebSocket();
  const { self } = useControllerData();
  const { config, locations, postals, settings } = useStore();

  const visibility: EventLogVisibility = props.overrideVisibility ?? {
    rtoFilterEnabled: settings.rtoFilterEnabled,
    showEventLogTime: settings.showEventLogTime,
    showEventLogChannel: settings.showEventLogChannel,
    showEventLogIdentifier: settings.showEventLogIdentifier,
    showEventLogLocation: settings.showEventLogLocation,
  };

  // Kept in refs so the stable message-listener callback always reads
  // the latest values without needing to resubscribe on every change.
  const selfRef = React.useRef(self);
  const visibilityRef = React.useRef(visibility);
  const configRef = React.useRef(config);
  React.useEffect(() => {
    selfRef.current = self;
  }, [self]);
  React.useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility.rtoFilterEnabled]);
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);

  const getChannel = (xmit: Array<number>): string | undefined => {
    for (const frequency of config.frequencies) {
      if (frequency.xmit[0] == xmit[0] && frequency.xmit[1] == xmit[1]) {
        return frequency.name;
      }
    }
  };

  const getLocation = (x: number, y: number): string => {
    let closestLocation;
    let closestDistance;
    for (const location of locations) {
      let distance = Math.sqrt(Math.pow(x - location.x, 2) + Math.pow(y - location.y, 2));
      if (distance < closestDistance || closestDistance == null) {
        closestLocation = location;
        closestDistance = distance;
      }
    }
    return closestLocation?.name ?? "Unknown";
  };

  const getPostal = (x: number, y: number): string => {
    let closestPostal;
    let closestDistance;
    for (const postal of postals) {
      let distance = Math.sqrt(Math.pow(x - postal.x, 2) + Math.pow(y - postal.y, 2));
      if (distance < closestDistance || closestDistance == null) {
        closestPostal = postal;
        closestDistance = distance;
      }
    }
    return closestPostal?.label ?? "";
  };

  const onSonoranWebSocketMessage = React.useCallback((event: MessageEvent) => {
    let data = JSON.parse(event.data);
    if (data.type == "client_xmit_change") {
      if (data.xmit_type == "unit_talk_permit") {
        const currentSelf = selfRef.current;
        const currentVisibility = visibilityRef.current;
        const currentConfig = configRef.current;

        const xmit = data.client.state.freq_xmit;
        const isMain = sameFreq(currentSelf?.state?.freq_xmit as number[], xmit);

        const matchingChannel = currentConfig.frequencies.find((f) => sameFreq(f.xmit, xmit));
        const isScanned = matchingChannel
          ? (currentSelf?.state?.freq_scan ?? []).some((f) => sameFreq(f, matchingChannel.recv))
          : false;

        const channelKind: Log["channelKind"] = isMain ? "main" : isScanned ? "scanned" : "other";

        // "Can Hear" filter: only log activity from a channel we're tuned to or scanning.
        if (currentVisibility.rtoFilterEnabled && channelKind === "other") {
          return;
        }

        const date = new Date();
        setLogs((prevLogs) => {
          const newLog: Log = {
            id: data.client.id,
            nickname: data.client.nickname,
            can_hear: data.can_hear,
            active: true,
            xmit: data.client.state.freq_xmit,
            recv: data.client.state.freq_recv,
            channelKind,
            game: data.client.state.game
              ? { x: data.client.state.game.position[0], y: data.client.state.game.position[1] }
              : undefined,
            timestamp: date,
          };
          return [newLog, ...prevLogs.slice(0, 49)];
        });
      } else if (data.xmit_type == "unit_squelch") {
        setLogs((prevLogs) =>
          prevLogs.map((log) => (log.id === data.client.id ? { ...log, active: false } : log))
        );
      }
    }
  }, []);

  React.useEffect(() => {
    sonoranWebSocket.addEventListener("message", onSonoranWebSocketMessage);
    return () => {
      sonoranWebSocket.removeEventListener("message", onSonoranWebSocketMessage);
    };
  }, [sonoranWebSocket]);

  const rowBackground = (log: Log, index: number): string => {
    if (log.active && log.channelKind === "main") return "rgba(63, 185, 80, 0.25)";
    if (log.active && log.channelKind === "scanned") return "rgba(56, 189, 248, 0.25)";
    return index % 2 === 0 ? "transparent" : "action.hover";
  };

  const visibleColumnCount =
    [
      visibility.showEventLogTime,
      visibility.showEventLogChannel,
      visibility.showEventLogIdentifier,
      visibility.showEventLogLocation,
    ].filter(Boolean).length || 1;

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ backgroundColor: "primary.main", px: 1.5, py: 0.5, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
          EVENT LOG
        </Typography>
      </Box>
      <TableContainer sx={{ backgroundColor: "background.paper", flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {visibility.showEventLogTime && <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>}
              {visibility.showEventLogChannel && <TableCell sx={{ fontWeight: "bold" }}>Channel</TableCell>}
              {visibility.showEventLogIdentifier && <TableCell sx={{ fontWeight: "bold" }}>Identifier</TableCell>}
              {visibility.showEventLogLocation && <TableCell sx={{ fontWeight: "bold" }}>Location</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumnCount}>
                  <Typography variant="body2" color="text.secondary">
                    No activity yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {logs.map((log, i) => (
              <TableRow
                key={i}
                sx={{ backgroundColor: rowBackground(log, i), transition: "background-color 300ms ease" }}
              >
                {visibility.showEventLogTime && (
                  <TableCell sx={{ color: "text.secondary" }}>
                    {formatEventLogTimestamp(log.timestamp, settings)}
                  </TableCell>
                )}
                {visibility.showEventLogChannel && (
                  <TableCell>{getChannel(log.xmit) ?? "Unknown Channel"}</TableCell>
                )}
                {visibility.showEventLogIdentifier && (
                  <TableCell sx={{ fontWeight: "bold" }}>{log.nickname}</TableCell>
                )}
                {visibility.showEventLogLocation && (
                  <TableCell>
                    {log.game
                      ? `${getLocation(log.game.x, log.game.y)}${
                          getPostal(log.game.x, log.game.y) ? " (" + getPostal(log.game.x, log.game.y) + ")" : ""
                        }`
                      : "-"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransmitLog;
