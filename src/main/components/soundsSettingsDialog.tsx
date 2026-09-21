import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  Slider,
  Divider,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestoreIcon from "@mui/icons-material/Restore";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import useStore from "../../shared/hooks/useStore";
import { SettingsType } from "../../config";
import { DEFAULT_TONE_DATA_URI } from "../utils/defaultTone";

type Props = {
  open: boolean;
  onClose: () => void;
};

const FIELDS: Array<{
  key: keyof Pick<
    SettingsType,
    | "soundFileLosSantos911"
    | "soundFileLosSantos311"
    | "soundFileBlaineCounty911"
    | "soundFileBlaineCounty311"
    | "soundFilePriority911"
  >;
  label: string;
}> = [
  { key: "soundFileLosSantos911", label: "Los Santos 911 Sound" },
  { key: "soundFileLosSantos311", label: "Los Santos 311 Sound" },
  { key: "soundFileBlaineCounty911", label: "Blaine County 911 Sound" },
  { key: "soundFileBlaineCounty311", label: "Blaine County 311 Sound" },
  { key: "soundFilePriority911", label: "Priority 911 Sound" },
];

const fileName = (path: string): string => {
  if (!path) return "Default Tone";
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
};

const SoundsSettingsDialog = (props: Props) => {
  const { settings, setSettings } = useStore();
  const [local, setLocal] = React.useState(settings);

  React.useEffect(() => {
    if (props.open) {
      setLocal(settings);
    }
  }, [props.open, settings]);

  const onChooseFile = async (key: (typeof FIELDS)[number]["key"]) => {
    const path = await window.electron.pickSoundFile();
    if (path) {
      setLocal({ ...local, [key]: path });
    }
  };

  const onTestSound = async (path: string) => {
    const src = path ? await window.electron.readSoundFileAsDataUrl(path) : DEFAULT_TONE_DATA_URI;
    if (!src) {
      console.error("[Sound] Could not read custom sound file:", path);
      return;
    }
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(100, local.alertVolume ?? 100)) / 100;
    audio.play().catch((err) => {
      console.error("[Sound] Test playback failed:", err, path);
    });
  };

  const onResetToDefault = (key: (typeof FIELDS)[number]["key"]) => {
    setLocal({ ...local, [key]: "" });
  };

  const onSave = () => {
    setSettings(local);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sounds</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <VolumeUpIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                Alert Volume
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                {local.alertVolume}%
              </Typography>
            </Stack>
            <Slider
              value={local.alertVolume}
              onChange={(_, value) => setLocal({ ...local, alertVolume: value as number })}
              min={0}
              max={100}
              step={5}
            />
          </Box>

          <Divider />

          {FIELDS.map((field) => (
            <Box key={field.key}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                {field.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {fileName(local[field.key])}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => onChooseFile(field.key)}>
                  Choose File...
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => onTestSound(local[field.key])}
                >
                  Test
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<RestoreIcon />}
                  onClick={() => onResetToDefault(field.key)}
                  disabled={!local[field.key]}
                >
                  Reset to Default
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SoundsSettingsDialog;
