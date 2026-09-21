import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Stack,
  Divider,
} from "@mui/material";
import useStore from "../../shared/hooks/useStore";
import { SettingsType } from "../../config";
import { listAvailableTimeZones } from "../utils/dateTimeFormat";

type Props = {
  open: boolean;
  onClose: () => void;
};

const DateTimeSettingsDialog = (props: Props) => {
  const { settings, setSettings } = useStore();
  const [selected, setSelected] = React.useState<SettingsType>(settings);
  const timeZones = React.useMemo(() => listAvailableTimeZones(), []);

  React.useEffect(() => {
    if (props.open) {
      setSelected(settings);
    }
  }, [props.open, settings]);

  const onSave = () => {
    setSettings(selected);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Date &amp; Time</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl>
            <FormLabel>Time Format</FormLabel>
            <RadioGroup
              row
              value={selected.timeFormat}
              onChange={(e) =>
                setSelected({ ...selected, timeFormat: e.target.value as SettingsType["timeFormat"] })
              }
            >
              <FormControlLabel value="12h" control={<Radio />} label="12-Hour" />
              <FormControlLabel value="24h" control={<Radio />} label="24-Hour" />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Date Format</FormLabel>
            <RadioGroup
              row
              value={selected.dateFormat}
              onChange={(e) =>
                setSelected({ ...selected, dateFormat: e.target.value as SettingsType["dateFormat"] })
              }
            >
              <FormControlLabel value="MDY" control={<Radio />} label="MM/DD/YYYY" />
              <FormControlLabel value="DMY" control={<Radio />} label="DD/MM/YYYY" />
            </RadioGroup>
          </FormControl>

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={selected.showSeconds}
                onChange={(e) => setSelected({ ...selected, showSeconds: e.target.checked })}
              />
            }
            label="Show Seconds"
          />
          <FormControlLabel
            control={
              <Switch
                checked={selected.showDate}
                onChange={(e) => setSelected({ ...selected, showDate: e.target.checked })}
              />
            }
            label="Show Date"
          />
          <FormControlLabel
            control={
              <Switch
                checked={selected.showTimeZone}
                onChange={(e) => setSelected({ ...selected, showTimeZone: e.target.checked })}
              />
            }
            label="Show Time Zone"
          />

          <Divider />

          <FormControl fullWidth>
            <FormLabel sx={{ mb: 1 }}>Set Time Zone</FormLabel>
            <Select
              size="small"
              value={selected.timeZone}
              onChange={(e) => setSelected({ ...selected, timeZone: e.target.value })}
            >
              <MenuItem value="system">System Default</MenuItem>
              {timeZones.map((tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

export default DateTimeSettingsDialog;
