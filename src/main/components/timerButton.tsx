import * as React from "react";
import {
  IconButton,
  Tooltip,
  Popover,
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton as MuiIconButton,
  Badge,
} from "@mui/material";
import AlarmIcon from "@mui/icons-material/Alarm";
import CloseIcon from "@mui/icons-material/Close";
import AddAlarmIcon from "@mui/icons-material/AddAlarm";

type Timer = {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  expired: boolean;
};

const formatTime = (totalSeconds: number): string => {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const playExpiredTone = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const playBeep = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    };
    playBeep(0);
    playBeep(0.35);
  } catch {
    // audio not available - the visual flash still indicates expiration
  }
};

const TimerButton = () => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [timers, setTimers] = React.useState<Timer[]>([]);
  const [minutesInput, setMinutesInput] = React.useState("5");
  const [labelInput, setLabelInput] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (t.expired || t.remainingSeconds <= 0) return t;
          const next = t.remainingSeconds - 1;
          if (next <= 0) {
            playExpiredTone();
            return { ...t, remainingSeconds: 0, expired: true };
          }
          return { ...t, remainingSeconds: next };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = timers.length;
  const hasExpired = timers.some((t) => t.expired);

  const onAddTimer = () => {
    const minutes = parseFloat(minutesInput);
    if (!minutes || minutes <= 0) return;
    const totalSeconds = Math.round(minutes * 60);
    setTimers((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        label: labelInput.trim() || "Timer",
        totalSeconds,
        remainingSeconds: totalSeconds,
        expired: false,
      },
    ]);
    setLabelInput("");
  };

  const onRemoveTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <Tooltip title="Timers">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            backgroundColor: "#2563eb",
            color: "#fff",
            animation: hasExpired ? "timerPulse 1s infinite" : "none",
            "@keyframes timerPulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
            "&:hover": { backgroundColor: "#2563eb", filter: "brightness(1.15)" },
          }}
        >
          <Badge badgeContent={activeCount} color={hasExpired ? "error" : "default"} invisible={activeCount === 0}>
            <AlarmIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box sx={{ p: 1.5, width: 280 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 0.5, color: "text.secondary" }}>
            TIMERS
          </Typography>

          <List dense disablePadding sx={{ mt: 1, mb: 1, maxHeight: 220, overflowY: "auto" }}>
            {timers.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
                No timers running.
              </Typography>
            )}
            {timers.map((t) => (
              <ListItem
                key={t.id}
                disablePadding
                sx={{
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 0.5,
                  backgroundColor: t.expired ? "error.dark" : "transparent",
                }}
                secondaryAction={
                  <MuiIconButton size="small" onClick={() => onRemoveTimer(t.id)}>
                    <CloseIcon fontSize="small" />
                  </MuiIconButton>
                }
              >
                <ListItemText
                  primary={t.label}
                  secondary={t.expired ? "Time's up" : formatTime(t.remainingSeconds)}
                  primaryTypographyProps={{ variant: "body2", fontWeight: "bold" }}
                  secondaryTypographyProps={{
                    variant: "body2",
                    sx: { fontFamily: "monospace", color: t.expired ? "#fff" : "text.secondary" },
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Min"
              type="number"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              sx={{ width: 70 }}
              inputProps={{ min: 0, step: 0.5 }}
            />
            <TextField
              size="small"
              label="Label"
              placeholder="e.g. Traffic stop"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Button
            fullWidth
            size="small"
            variant="contained"
            startIcon={<AddAlarmIcon />}
            onClick={onAddTimer}
            sx={{ mt: 1 }}
          >
            Start Timer
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default TimerButton;
