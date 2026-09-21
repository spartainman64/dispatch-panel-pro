import * as React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import useStore from "../../shared/hooks/useStore";
import useControllerData from "../hooks/useControllerData";
import useSonoranWebSocket from "../hooks/useSonoranWebSocket";
import { categoryColor, categoryLabel } from "../utils/channelCategory";
import SignalBar from "./signalBar";
import { isDispatcherName } from "../../shared/utils/ts3ChannelList";

const sameFreq = (a?: [number, number], b?: [number, number]) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

const ChannelDetail = () => {
  const { config } = useStore();
  const { self } = useControllerData();
  const sonoranWebSocket = useSonoranWebSocket();

  const currentXmit = self?.state?.freq_xmit;
  const index = config.frequencies.findIndex((f) => sameFreq(f.xmit, currentXmit as [number, number]));
  const freq = index >= 0 ? config.frequencies[index] : null;

  const [tunedSignal, setTunedSignal] = React.useState<number | null>(null);
  const [scannedSignal, setScannedSignal] = React.useState<number | null>(null);
  const tunedActiveId = React.useRef<number | null>(null);
  const scannedActiveId = React.useRef<number | null>(null);

  const selfRef = React.useRef(self);
  const configRef = React.useRef(config);
  React.useEffect(() => {
    selfRef.current = self;
  }, [self]);
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);

  const onMessage = React.useCallback((event: MessageEvent) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    if (data.type !== "client_xmit_change") return;

    const currentSelf = selfRef.current;
    const currentConfig = configRef.current;
    const rawQuality: number | undefined = data.client?.state?.game?.tower_quality;
    const nickname: string = data.client?.nickname ?? "";
    // Dispatchers usually aren't spawned in-game, so they have no real
    // tower_quality data and would otherwise show as an empty/0% bar even
    // though their comms are actually clear - treat their transmissions as
    // near-full signal instead.
    const quality = isDispatcherName(nickname) ? 0.99 : rawQuality ?? 0;

    if (data.xmit_type === "unit_talk_permit") {
      const xmit = data.client.state.freq_xmit;
      const isMain = sameFreq(currentSelf?.state?.freq_xmit as [number, number], xmit);
      const matchingChannel = currentConfig.frequencies.find((f) => sameFreq(f.xmit, xmit));
      const isScanned = matchingChannel
        ? (currentSelf?.state?.freq_scan ?? []).some((f) => sameFreq(f, matchingChannel.recv))
        : false;

      if (isMain) {
        tunedActiveId.current = data.client.id;
        setTunedSignal(quality);
      } else if (isScanned) {
        scannedActiveId.current = data.client.id;
        setScannedSignal(quality);
      }
    } else if (data.xmit_type === "unit_squelch") {
      if (tunedActiveId.current === data.client.id) {
        tunedActiveId.current = null;
        setTunedSignal(null);
      }
      if (scannedActiveId.current === data.client.id) {
        scannedActiveId.current = null;
        setScannedSignal(null);
      }
    }
  }, []);

  React.useEffect(() => {
    sonoranWebSocket.addEventListener("message", onMessage);
    return () => sonoranWebSocket.removeEventListener("message", onMessage);
  }, [sonoranWebSocket, onMessage]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ backgroundColor: "primary.main", px: 1.5, py: 0.5, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
          SELECTED CHANNEL
        </Typography>
      </Box>
      <Box sx={{ backgroundColor: "background.paper", p: 1.5, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {!freq ? (
          <Typography variant="body2" color="text.secondary">
            No channel selected.
          </Typography>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
              SELECTED CHANNEL
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
              {freq.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {`${freq.xmit[0]}.${String(freq.xmit[1]).padStart(3, "0")}MHz`}
              </Typography>
              <Chip
                size="small"
                label={categoryLabel(freq.category)}
                sx={{
                  backgroundColor: categoryColor(freq.category),
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 11,
                  height: 20,
                }}
              />
            </Stack>
            {freq.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {freq.description}
              </Typography>
            )}

            <Stack spacing={2} sx={{ mt: 2 }}>
              <SignalBar label="TUNED SIGNAL" value={tunedSignal} />
              <SignalBar label="SCANNED SIGNAL" value={scannedSignal} />
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChannelDetail;
