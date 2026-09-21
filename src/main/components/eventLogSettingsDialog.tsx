import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  Divider,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import useStore from "../../shared/hooks/useStore";
import { SettingsType } from "../../config";

type Props = {
  open: boolean;
  onClose: () => void;
};

const EventLogSettingsDialog = (props: Props) => {
  const { settings, setSettings } = useStore();
  const [local, setLocal] = React.useState(settings);

  React.useEffect(() => {
    if (props.open) {
      setLocal(settings);
    }
  }, [props.open, settings]);

  const onSave = () => {
    setSettings(local);
    props.onClose();
  };

  const toggle = (key: keyof SettingsType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal({ ...local, [key]: e.target.checked });
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Event Log</DialogTitle>
      <DialogContent>
        <Stack spacing={0.5}>
          <FormControlLabel
            control={<Switch checked={local.rtoFilterEnabled} onChange={toggle("rtoFilterEnabled")} />}
            label="Can Hear"
          />

          <Divider sx={{ my: 1 }} />

          <FormControlLabel
            control={<Switch checked={local.showEventLogTime} onChange={toggle("showEventLogTime")} />}
            label="Time"
          />
          <FormControlLabel
            control={<Switch checked={local.showEventLogChannel} onChange={toggle("showEventLogChannel")} />}
            label="Channel"
          />
          <FormControlLabel
            control={
              <Switch checked={local.showEventLogIdentifier} onChange={toggle("showEventLogIdentifier")} />
            }
            label="Identifier"
          />
          <FormControlLabel
            control={<Switch checked={local.showEventLogLocation} onChange={toggle("showEventLogLocation")} />}
            label="Location"
          />

          <Divider sx={{ my: 1 }} />

          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => window.electron.openEventLogWindow()}
          >
            Open in New Window
          </Button>
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

export default EventLogSettingsDialog;
