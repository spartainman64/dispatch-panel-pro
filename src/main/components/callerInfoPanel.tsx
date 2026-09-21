import * as React from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Alert,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import SearchIcon from "@mui/icons-material/Search";
import useStore from "../../shared/hooks/useStore";

const CALL_CONTEXT_POLL_MS = 4000;
const CIVILIAN_LIST_POLL_MS = 5000;

type Caller = { id: string; nickname: string };
type Civilian = { id: string; nickname: string; channelName: string };

type Context = {
  status: "rto" | "call" | "other";
  label: string;
  callers: Caller[];
};

const CallerInfoPanel = () => {
  const { settings } = useStore();
  const [tab, setTab] = React.useState(0);

  const [context, setContext] = React.useState<Context>({ status: "other", label: "", callers: [] });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const [civilians, setCivilians] = React.useState<Civilian[]>([]);
  const [civilianSearch, setCivilianSearch] = React.useState("");
  const [civFeedback, setCivFeedback] = React.useState<string | null>(null);
  const [civMenu, setCivMenu] = React.useState<{ anchor: HTMLElement; civilian: Civilian } | null>(null);

  const prevStatusRef = React.useRef<Context["status"]>("other");

  // Current call channel (for Call Line tab)
  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const result = await window.electron.ts3.getCallerContext();
      if (cancelled || !result.success) return;
      setContext({ status: result.status, label: result.label, callers: result.callers });
      setSelectedId((prev) => (prev && result.callers.some((c) => c.id === prev) ? prev : null));

      // Jump to the Call Line tab the moment you join a call channel, but
      // only on that transition - not every poll while you're still in it,
      // so you're free to switch back to Civilians without it fighting you.
      if (result.status === "call" && prevStatusRef.current !== "call") {
        setTab(1);
      }
      prevStatusRef.current = result.status;
    };
    poll();
    const interval = setInterval(poll, CALL_CONTEXT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Civ Group roster (for Civilians tab)
  React.useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const result = await window.electron.ts3.listCivilians();
      if (cancelled || !result.success) return;
      setCivilians(result.civilians);
    };
    poll();
    const interval = setInterval(poll, CIVILIAN_LIST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const selectedCaller = context.callers.find((c) => c.id === selectedId);

  const onCallTrace = async () => {
    if (!selectedCaller) return;
    setFeedback(null);
    const result = await window.electron.ts3.pokeClient(selectedCaller.id, settings.callTraceMessage);
    setFeedback(result.success ? `Sent to ${selectedCaller.nickname}` : `Failed: ${result.message}`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const onRequestCallback = async (civilian: Civilian) => {
    setCivMenu(null);
    setCivFeedback(null);
    const result = await window.electron.ts3.pokeClient(civilian.id, settings.requestCallbackMessage);
    setCivFeedback(
      result.success ? `Requested callback from ${civilian.nickname}` : `Failed: ${result.message}`
    );
    setTimeout(() => setCivFeedback(null), 4000);
  };

  const onRelease = async (person: { id: string; nickname: string }) => {
    setFeedback(null);
    const result = await window.electron.ts3.moveCivilian(person.id, "release");
    setFeedback(
      result.success ? `Released ${person.nickname}` : `Failed to release ${person.nickname}: ${result.message}`
    );
    setTimeout(() => setFeedback(null), 4000);
  };

  const statusText =
    context.status === "rto" || context.status === "call" ? `Connected to ${context.label}` : "Not connected";

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: "primary.main",
          px: 1.5,
          py: 0.5,
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
          CALL CENTER
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
          {statusText}
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ flexShrink: 0, minHeight: 36 }}>
        <Tab label="CIVILIANS" sx={{ minHeight: 36, fontSize: 12 }} />
        <Tab label="CALL LINE" sx={{ minHeight: 36, fontSize: 12 }} />
      </Tabs>

      <Box sx={{ backgroundColor: "background.paper", p: 1, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {tab === 0 && (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Search civilians..."
              value={civilianSearch}
              onChange={(e) => setCivilianSearch(e.target.value)}
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
              {civilians.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 0.5 }}>
                  No civilians in the Civ Group channel.
                </Typography>
              )}
              {civilians.length > 0 &&
                civilians.filter((c) => c.nickname.toLowerCase().includes(civilianSearch.toLowerCase()))
                  .length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 0.5 }}>
                    No civilians match your search.
                  </Typography>
                )}
              {civilians
                .filter((c) => c.nickname.toLowerCase().includes(civilianSearch.toLowerCase()))
                .map((civ) => (
                <ListItemButton
                  key={civ.id}
                  dense
                  sx={{ py: 0.5, borderRadius: 0.5, cursor: "context-menu" }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCivMenu({ anchor: e.currentTarget, civilian: civ });
                  }}
                >
                  <ListItemText
                    primary={civ.nickname}
                    secondary={civ.channelName}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItemButton>
              ))}
            </List>
            {civFeedback && (
              <Alert severity={civFeedback.startsWith("Failed") ? "error" : "success"} sx={{ mt: 1, py: 0 }}>
                {civFeedback}
              </Alert>
            )}

            <Menu anchorEl={civMenu?.anchor} open={!!civMenu} onClose={() => setCivMenu(null)}>
              <MenuItem onClick={() => civMenu && onRequestCallback(civMenu.civilian)}>Request Callback</MenuItem>
            </Menu>
          </>
        )}

        {tab === 1 && (
          <>
            <List dense disablePadding sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {context.status !== "call" && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 0.5 }}>
                  Not currently connected to a 911/311 call channel.
                </Typography>
              )}
              {context.status === "call" && context.callers.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 0.5, pt: 0.5 }}>
                  No callers in this channel.
                </Typography>
              )}
              {context.status === "call" &&
                context.callers.map((caller) => (
                  <ListItemButton
                    key={caller.id}
                    selected={caller.id === selectedId}
                    onClick={() => setSelectedId(caller.id)}
                    sx={{ py: 0.5, borderRadius: 0.5 }}
                  >
                    <ListItemText primary={caller.nickname} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItemButton>
                ))}
            </List>

            {context.status === "call" && context.callers.length > 0 && (
              <Box sx={{ pt: 1, flexShrink: 0, display: "flex", gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  startIcon={<GpsFixedIcon />}
                  disabled={!selectedCaller}
                  onClick={onCallTrace}
                >
                  {selectedCaller ? `Call Trace: ${selectedCaller.nickname}` : "Select a caller to trace"}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  disabled={!selectedCaller}
                  onClick={() => selectedCaller && onRelease(selectedCaller)}
                >
                  Release
                </Button>
              </Box>
            )}
            {feedback && (
              <Alert severity={feedback.startsWith("Sent") || feedback.startsWith("Released") ? "success" : "error"} sx={{ mt: 1, py: 0 }}>
                {feedback}
              </Alert>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CallerInfoPanel;
