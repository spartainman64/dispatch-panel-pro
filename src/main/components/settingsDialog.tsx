import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  TextField,
} from "@mui/material";
import useStore from "../../shared/hooks/useStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SettingsDialog = (props: Props) => {
  const { settings, setSettings } = useStore();
  const [url, setUrl] = React.useState(settings.sonoranWebSocketUrl);

  React.useEffect(() => {
    if (props.open) {
      setUrl(settings.sonoranWebSocketUrl);
    }
  }, [props.open, settings.sonoranWebSocketUrl]);

  const onSave = () => {
    setSettings({ ...settings, sonoranWebSocketUrl: url });
    window.electron.reload();
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Configuration</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <FormLabel sx={{ mb: 1 }}>Sonoran Websocket URL</FormLabel>
          <TextField
            variant="outlined"
            size="small"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormControl>
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

export default SettingsDialog;
