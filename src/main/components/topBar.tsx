import * as React from "react";
import { Box, Stack, Typography, Chip, Menu, MenuItem, Button, Tooltip, Divider, IconButton } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import useControllerData from "../hooks/useControllerData";
import useStore from "../../shared/hooks/useStore";
import { formatClockTime, formatClockDate, formatTimeZoneLabel } from "../utils/dateTimeFormat";
import { SettingsType } from "../../config";
import { DEFAULT_TONE_DATA_URI } from "../utils/defaultTone";

const MENU_ITEMS = ["File", "Configuration", "View", "Help"];
const PENDING_KEYS = [
  "losSantos911",
  "losSantos311",
  "blaineCounty911",
  "blaineCounty311",
  "priority911",
];

type PendingState = { count: number; acknowledgedCount: number };

const KEY_TO_SOUND_SETTING: Record<string, keyof SettingsType> = {
  losSantos911: "soundFileLosSantos911",
  losSantos311: "soundFileLosSantos311",
  blaineCounty911: "soundFileBlaineCounty911",
  blaineCounty311: "soundFileBlaineCounty311",
  priority911: "soundFilePriority911",
};

const playSynthesizedBeep = (volume: number) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.error("[Sound] Synthesized beep failed too - no audio possible:", err);
  }
};

const playDefaultTone = (volume: number) => {
  try {
    const audio = new Audio(DEFAULT_TONE_DATA_URI);
    audio.volume = volume;
    audio.play().catch((err) => {
      console.error("[Sound] Default tone failed to play:", err);
      playSynthesizedBeep(volume);
    });
  } catch (err) {
    console.error("[Sound] Default tone threw before playing:", err);
    playSynthesizedBeep(volume);
  }
};

const playAlertSound = (buttonKey: string, settings: SettingsType) => {
  const volume = Math.max(0, Math.min(100, settings.alertVolume ?? 100)) / 100;
  const settingKey = KEY_TO_SOUND_SETTING[buttonKey];
  const customPath = settingKey ? (settings[settingKey] as string) : "";
  if (customPath) {
    try {
      const audio = new Audio(`file://${customPath}`);
      audio.volume = volume;
      audio.play().catch((err) => {
        console.error(`[Sound] Custom sound for "${buttonKey}" failed to play:`, err, customPath);
        playDefaultTone(volume);
      });
      return;
    } catch (err) {
      console.error(`[Sound] Custom sound for "${buttonKey}" threw before playing:`, err, customPath);
    }
  }
  playDefaultTone(volume);
};

type Props = {
  onOpenWebsocketSettings: () => void;
  onOpenDateTimeSettings: () => void;
  onOpenThemeSettings: () => void;
  onOpenTs3Settings: () => void;
  onOpenEventLogSettings: () => void;
  onOpenSoundsSettings: () => void;
  onOpenUserGuide: () => void;
};

const TopBar = (props: Props) => {
  const { connected, units, self } = useControllerData();
  const { settings } = useStore();
  const [now, setNow] = React.useState(new Date());
  const [fileMenuAnchor, setFileMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [configMenuAnchor, setConfigMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [helpMenuAnchor, setHelpMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [pending, setPending] = React.useState<Record<string, PendingState>>(
    Object.fromEntries(PENDING_KEYS.map((k) => [k, { count: 0, acknowledgedCount: 0 }]))
  );
  const settingsRef = React.useRef(settings);
  React.useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const [soundMuted, setSoundMuted] = React.useState(false);
  const mutedRef = React.useRef(soundMuted);
  React.useEffect(() => {
    mutedRef.current = soundMuted;
  }, [soundMuted]);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const wasFlashingRef = React.useRef<Record<string, boolean>>({});

  React.useEffect(() => {
    const applyCounts = (counts: Record<string, number>, dispatcherPresent: Record<string, boolean>) => {
      const newlyFlashingKeys = new Set<string>();
      setPending((prev) => {
        const next = { ...prev };
        for (const key of PENDING_KEYS) {
          const newCount = counts[key] ?? 0;
          const prevState = prev[key] ?? { count: 0, acknowledgedCount: 0 };
          // Reset acknowledgement once the channel is empty, so the next
          // arrival always triggers a fresh alert instead of being
          // silently suppressed by a stale acknowledgedCount left over
          // from a previous, already-handled call.
          let acknowledgedCount = newCount === 0 ? 0 : prevState.acknowledgedCount;

          // If another dispatcher has joined this channel, treat it as
          // handled - clear/suppress the flash.
          if (dispatcherPresent[key]) {
            acknowledgedCount = newCount;
          }

          next[key] = { count: newCount, acknowledgedCount };

          const isFlashingNow = newCount > acknowledgedCount;
          const wasFlashingBefore = wasFlashingRef.current[key] ?? false;
          if (isFlashingNow && !wasFlashingBefore) {
            newlyFlashingKeys.add(key);
          }
          wasFlashingRef.current[key] = isFlashingNow;
        }
        return next;
      });

      // Only plays once, right when a button newly starts flashing - not
      // on every subsequent poll while it remains unacknowledged.
      newlyFlashingKeys.forEach((key) => {
        if (!mutedRef.current) playAlertSound(key, settingsRef.current);
      });
    };

    // Also fetch once immediately on mount, so the buttons reflect current
    // state right away rather than waiting for the first main-process push.
    window.electron.ts3.getPendingCounts().then((result) => {
      if (result.success) applyCounts(result.counts, result.dispatcherPresent);
    });

    const unsubscribe = window.electron.ts3.onPendingCountsUpdate((result) =>
      applyCounts(result.counts, result.dispatcherPresent)
    );
    return unsubscribe;
  }, []);

  const onlineCount = (units ?? []).filter((u) => u.name !== self?.nickname).length;

  const closeFileMenu = () => setFileMenuAnchor(null);
  const closeConfigMenu = () => setConfigMenuAnchor(null);
  const closeViewMenu = () => setViewMenuAnchor(null);
  const closeHelpMenu = () => setHelpMenuAnchor(null);

  const onBackupConfiguration = async () => {
    const result = await window.electron.backupConfiguration();
    if (!result.success && result.message !== "Cancelled") {
      console.error("[Backup] Failed:", result.message);
    }
  };

  const onRestoreConfiguration = async () => {
    const result = await window.electron.restoreConfiguration();
    if (!result.success && result.message !== "Cancelled") {
      console.error("[Restore] Failed:", result.message);
    }
  };

  const acknowledgePending = (buttonKey: string) => {
    setPending((prev) => {
      const state = prev[buttonKey];
      if (!state) return prev;
      return { ...prev, [buttonKey]: { ...state, acknowledgedCount: state.count } };
    });
  };

  const moveToChannel = async (buttonKey: string) => {
    if (PENDING_KEYS.includes(buttonKey)) {
      acknowledgePending(buttonKey);
    }
    const result = await window.electron.ts3.move(buttonKey);
    if (!result.success) {
      console.warn("[TS3] Failed to move channel:", result.message, "raw whoami data:", result.data);
    }
  };

  const timeStr = formatClockTime(now, settings);
  const dateStr = formatClockDate(now, settings);
  const tzStr = formatTimeZoneLabel(now, settings);

  const isButtonConfigured = (buttonKey: string) =>
    settings.ts3ServerProfiles.some((p) =>
      buttonKey === "rto" ? !!p.rtoChannelId : !!(p as any)[buttonKey]
    );

  const channelButton = (label: string, color: string, buttonKey: string) => {
    const configured = isButtonConfigured(buttonKey);
    const state = pending[buttonKey];
    const flashing = !!state && state.count > state.acknowledgedCount;
    const isPendingTracked = PENDING_KEYS.includes(buttonKey);
    const baseColor = isPendingTracked ? "#16a34a" : color;
    const activeColor = flashing ? "#dc2626" : baseColor;
    return (
      <Tooltip
        title={
          !configured
            ? "Set this channel in Configuration \u2192 TeamSpeak Settings"
            : flashing
            ? `${state.count} waiting \u2014 right-click to clear without joining`
            : ""
        }
      >
        <span>
          <Button
            variant="contained"
            disabled={!configured}
            onClick={() => moveToChannel(buttonKey)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (isPendingTracked) acknowledgePending(buttonKey);
            }}
            sx={{
              backgroundColor: activeColor,
              color: "#fff",
              fontWeight: "bold",
              fontSize: 13,
              px: 2,
              py: 0.75,
              minWidth: 0,
              animation: flashing ? "pendingFlash 1s infinite" : "none",
              "@keyframes pendingFlash": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.35 },
              },
              "&:hover": { backgroundColor: activeColor, filter: "brightness(1.1)" },
              "&.Mui-disabled": { backgroundColor: "action.disabledBackground", color: "text.disabled" },
            }}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
    );
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ backgroundColor: "background.paper", px: 1.5, py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Stack direction="row" spacing={2}>
          {MENU_ITEMS.map((item) => (
            <Typography
              key={item}
              variant="caption"
              onClick={
                item === "File"
                  ? (e) => setFileMenuAnchor(e.currentTarget)
                  : item === "Configuration"
                  ? (e) => setConfigMenuAnchor(e.currentTarget)
                  : item === "View"
                  ? (e) => setViewMenuAnchor(e.currentTarget)
                  : item === "Help"
                  ? (e) => setHelpMenuAnchor(e.currentTarget)
                  : undefined
              }
              sx={{
                textDecoration: "underline",
                cursor:
                  item === "File" || item === "Configuration" || item === "View" || item === "Help"
                    ? "pointer"
                    : "default",
                color: "text.secondary",
                "&:hover":
                  item === "File" || item === "Configuration" || item === "View" || item === "Help"
                    ? { color: "text.primary" }
                    : undefined,
              }}
            >
              {item}
            </Typography>
          ))}
        </Stack>
        <Chip
          size="small"
          label={connected ? "ONLINE" : "OFFLINE"}
          icon={
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: connected ? "success.main" : "error.main",
                ml: 1,
              }}
            />
          }
          sx={{ fontWeight: "bold", backgroundColor: "transparent" }}
        />
      </Stack>

      <Menu anchorEl={fileMenuAnchor} open={!!fileMenuAnchor} onClose={closeFileMenu}>
        <MenuItem
          onClick={() => {
            closeFileMenu();
            onBackupConfiguration();
          }}
        >
          Backup Configuration...
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeFileMenu();
            onRestoreConfiguration();
          }}
        >
          Restore Configuration...
        </MenuItem>
      </Menu>

      <Menu anchorEl={configMenuAnchor} open={!!configMenuAnchor} onClose={closeConfigMenu}>
        <MenuItem
          onClick={() => {
            closeConfigMenu();
            props.onOpenWebsocketSettings();
          }}
        >
          Websocket Settings...
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeConfigMenu();
            props.onOpenDateTimeSettings();
          }}
        >
          Date &amp; Time...
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeConfigMenu();
            props.onOpenThemeSettings();
          }}
        >
          Theme...
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeConfigMenu();
            props.onOpenTs3Settings();
          }}
        >
          TeamSpeak Settings...
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeConfigMenu();
            props.onOpenSoundsSettings();
          }}
        >
          Sounds...
        </MenuItem>
      </Menu>

      <Menu anchorEl={viewMenuAnchor} open={!!viewMenuAnchor} onClose={closeViewMenu}>
        <MenuItem
          onClick={() => {
            closeViewMenu();
            props.onOpenEventLogSettings();
          }}
        >
          Event Log...
        </MenuItem>
      </Menu>

      <Menu anchorEl={helpMenuAnchor} open={!!helpMenuAnchor} onClose={closeHelpMenu}>
        <MenuItem
          onClick={() => {
            closeHelpMenu();
            props.onOpenUserGuide();
          }}
        >
          User Guide...
        </MenuItem>
      </Menu>

      <Box
        sx={{
          backgroundColor: "background.paper",
          px: 1.5,
          py: 0.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          columnGap: 1,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: "bold", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
          {onlineCount} UNIT{onlineCount === 1 ? "" : "S"} ONLINE
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ justifySelf: "center" }}>
          <Tooltip title={soundMuted ? "Unmute alert tones" : "Mute alert tones"}>
            <IconButton
              size="small"
              onClick={() => setSoundMuted((prev) => !prev)}
              sx={{ color: soundMuted ? "error.main" : "text.secondary" }}
            >
              {soundMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              backgroundColor: "action.hover",
              borderRadius: 0.5,
              px: 2.5,
              py: 0.5,
              textAlign: "center",
              minWidth: 160,
            }}
          >
            {settings.showTimeZone && tzStr && (
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", letterSpacing: 0.5 }}>
                {tzStr}
              </Typography>
            )}
            <Typography sx={{ fontFamily: "monospace", fontSize: 22, fontWeight: "bold", lineHeight: 1.2 }}>
              {timeStr}
            </Typography>
            {settings.showDate && (
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                {dateStr}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          rowGap={1}
          sx={{ justifySelf: "end", justifyContent: "flex-end" }}
        >
          {channelButton("RTO", "#2563eb", "rto")}

          <Divider orientation="vertical" flexItem sx={{ borderColor: "divider" }} />

          <Stack alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", letterSpacing: 0.5 }}>
              LOS SANTOS
            </Typography>
            <Stack direction="row" spacing={1}>
              {channelButton("911", "#dc2626", "losSantos911")}
              {channelButton("311", "#d97706", "losSantos311")}
            </Stack>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ borderColor: "divider" }} />

          <Stack alignItems="center" spacing={0.5}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "bold", letterSpacing: 0.5 }}>
              BLAINE COUNTY
            </Typography>
            <Stack direction="row" spacing={1}>
              {channelButton("911", "#dc2626", "blaineCounty911")}
              {channelButton("311", "#d97706", "blaineCounty311")}
            </Stack>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ borderColor: "divider" }} />

          {channelButton("PRIORITY 911", "#b91c1c", "priority911")}
        </Stack>
      </Box>
    </Box>
  );
};

export default TopBar;
