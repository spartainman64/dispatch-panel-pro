import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import useStore from "../../shared/hooks/useStore";
import { THEMES } from "../utils/themes";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ThemeSettingsDialog = (props: Props) => {
  const { settings, setSettings } = useStore();
  const [selectedTheme, setSelectedTheme] = React.useState(settings.themeName);

  React.useEffect(() => {
    if (props.open) {
      setSelectedTheme(settings.themeName);
    }
  }, [props.open, settings.themeName]);

  const onSave = () => {
    setSettings({ ...settings, themeName: selectedTheme });
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Theme</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {Object.entries(THEMES).map(([key, preset]) => {
            const isSelected = selectedTheme === key;
            return (
              <Box
                key={key}
                onClick={() => setSelectedTheme(key)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1,
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: preset.swatch,
                    flexShrink: 0,
                    border: "2px solid",
                    borderColor: "divider",
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {preset.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {preset.mode === "dark" ? "Dark" : "Light"}
                  </Typography>
                </Box>
                {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
              </Box>
            );
          })}
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

export default ThemeSettingsDialog;
