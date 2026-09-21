import * as React from "react";
import { Box, Stack, Typography, Checkbox, Tooltip } from "@mui/material";
import useStore from "../../shared/hooks/useStore";
import useSonoranWebSocket from "../hooks/useSonoranWebSocket";
import useControllerData from "../hooks/useControllerData";
import { FrequencyConfig } from "../../config";
import { categoryColor } from "../utils/channelCategory";

const sameFreq = (a?: [number, number], b?: [number, number]) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

const formatMHz = (freq: [number, number]) => `${freq[0]}.${String(freq[1]).padStart(3, "0")}MHz`;

const ChannelGrid = () => {
  const { config } = useStore();
  const sonoranWebSocket = useSonoranWebSocket();
  const { self, units } = useControllerData();

  const currentXmit = self?.state?.freq_xmit;
  const scanList = self?.state?.freq_scan ?? [];
  const scanEnabled = self?.state?.enable_scan ?? false;

  const safeSend = (payload: object) => {
    if (sonoranWebSocket?.readyState === WebSocket.OPEN) {
      sonoranWebSocket.send(JSON.stringify(payload));
    }
  };

  const setMainChannel = (freq: FrequencyConfig) => {
    safeSend({ type: "set_frequencies", freq_recv: freq.recv, freq_xmit: freq.xmit });
  };

  const toggleScanChannel = (freq: FrequencyConfig) => {
    const isScanned = scanList.some((f) => sameFreq(f, freq.recv));
    const nextList = isScanned
      ? scanList.filter((f) => !sameFreq(f, freq.recv))
      : [...scanList, freq.recv];
    safeSend({ type: "set_frequencies_scanned", freqs: nextList });
  };

  const toggleScanning = () => {
    safeSend({ type: "set_scanning_enabled", enabled: !scanEnabled });
  };

  const countOnChannel = (freq: FrequencyConfig) =>
    (units ?? []).filter((u) => sameFreq(u.state?.freq_xmit, freq.xmit)).length;

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          backgroundColor: "primary.main",
          px: 1.5,
          py: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
          RADIO CHANNELS
        </Typography>
        <Tooltip title={scanEnabled ? "Click to stop scanning" : "Click to start scanning your selected channels"}>
          <Box
            component="button"
            onClick={toggleScanning}
            sx={{
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 11,
              letterSpacing: 0.5,
              px: 1.5,
              py: 0.4,
              borderRadius: 0.5,
              backgroundColor: scanEnabled ? "#1a7f37" : "#b91c1c",
              color: "#fff",
              "&:hover": { filter: "brightness(1.1)" },
            }}
          >
            {scanEnabled ? "SCANNING" : "NOT SCANNING"}
          </Box>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          backgroundColor: "background.paper",
          p: 1,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 1,
          alignContent: "start",
        }}
      >
        {config.frequencies.map((freq, i) => {
          const isMain = sameFreq(currentXmit as [number, number], freq.xmit);
          const isScanned = scanList.some((f) => sameFreq(f, freq.recv));
          const color = categoryColor(freq.category);
          const peopleCount = countOnChannel(freq);

          return (
            <Stack
              key={i}
              direction="row"
              alignItems="center"
              onClick={() => setMainChannel(freq)}
              sx={{
                cursor: "pointer",
                borderLeft: `4px solid ${color}`,
                backgroundColor: isMain ? "action.selected" : "action.hover",
                "&:hover": { backgroundColor: "action.selected" },
                py: 0.75,
                pr: 1,
              }}
            >
              <Checkbox
                checked={isScanned}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleScanChannel(freq)}
                sx={{ color: "text.secondary", "& .MuiSvgIcon-root": { fontSize: 30 } }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ fontWeight: isMain ? "bold" : 500, color: "text.primary" }}
                >
                  {freq.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {formatMHz(freq.xmit)}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  {peopleCount} on channel
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>

      {config.frequencies.length === 0 && (
        <Box sx={{ backgroundColor: "background.paper", p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No channels configured yet. Add them from Settings.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChannelGrid;
