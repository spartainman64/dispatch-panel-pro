import * as React from "react";
import { Box, Typography, TextField, InputAdornment, List, ListItemButton, ListItemText } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import useControllerData from "../hooks/useControllerData";
import useStore from "../../shared/hooks/useStore";

const RTO_CHECK_POLL_MS = 4000;

const sameFreq = (a?: [number, number], b?: [number, number]) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

const formatMHz = (freq: [number, number]) => `${freq[0]}.${String(freq[1]).padStart(3, "0")}MHz`;

const ChannelInfoPanel = () => {
  const { self, units } = useControllerData();
  const { config } = useStore();
  const [search, setSearch] = React.useState("");
  const [inRto, setInRto] = React.useState<boolean | null>(null);

  // Radio frequencies are only visible to SonoranRadio for units in the
  // SAME TeamSpeak channel as the local client - so this panel only shows
  // real data while the dispatcher is themselves in the RTO channel.
  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const result = await window.electron.ts3.getCallerContext();
      if (cancelled || !result.success) return;
      setInRto(result.status === "rto");
    };
    poll();
    const interval = setInterval(poll, RTO_CHECK_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const channelNameFor = (xmit?: [number, number]): string | null => {
    if (!xmit) return null;
    const match = config.frequencies.find((f) => sameFreq(f.xmit, xmit));
    return match ? match.name : null;
  };

  const rtoUnits = (units ?? []).filter((u) => u.name !== self?.nickname);
  const filtered = rtoUnits.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ backgroundColor: "primary.main", px: 1.5, py: 0.5, flexShrink: 0 }}>
        <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
          CHANNEL INFORMATION
        </Typography>
      </Box>

      <Box sx={{ backgroundColor: "background.paper", p: 1, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {inRto === false ? (
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
            You must be in the RTO channel yourself to see unit frequencies here - SonoranRadio only shares
            that data with people in the same TeamSpeak channel.
          </Typography>
        ) : (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Search units..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1, flexShrink: 0 }}
            />

            <List dense disablePadding sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 1 }}>
                  {rtoUnits.length === 0 ? "No other units in RTO." : "No units match your search."}
                </Typography>
              )}
              {filtered.map((unit) => {
                const xmit = unit.state?.freq_xmit as [number, number] | undefined;
                const channelName = channelNameFor(xmit);
                return (
                  <ListItemButton key={unit.id} disableRipple dense sx={{ py: 0.5, cursor: "default" }}>
                    <ListItemText
                      primary={unit.name}
                      secondary={xmit ? (channelName ? `${channelName} (${formatMHz(xmit)})` : formatMHz(xmit)) : "Unknown"}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ChannelInfoPanel;
