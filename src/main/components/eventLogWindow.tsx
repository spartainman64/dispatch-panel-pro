import * as React from "react";
import { Box, Typography, Menu, MenuItem, ListItemIcon } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import TransmitLog, { EventLogVisibility } from "./transmitLog";

const DEFAULT_VISIBILITY: EventLogVisibility = {
  rtoFilterEnabled: true,
  showEventLogTime: true,
  showEventLogChannel: true,
  showEventLogIdentifier: true,
  showEventLogLocation: true,
};

const TOGGLE_ITEMS: Array<{ key: keyof EventLogVisibility; label: string }> = [
  { key: "rtoFilterEnabled", label: "Can Hear" },
  { key: "showEventLogTime", label: "Time" },
  { key: "showEventLogChannel", label: "Channel" },
  { key: "showEventLogIdentifier", label: "Identifier" },
  { key: "showEventLogLocation", label: "Location" },
];

const EventLogWindow = () => {
  // Local-only state, intentionally not persisted to the shared settings
  // store - this keeps the popout's View toggles independent of the main
  // window's Event Log settings.
  const [visibility, setVisibility] = React.useState<EventLogVisibility>(DEFAULT_VISIBILITY);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

  const toggle = (key: keyof EventLogVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: "background.paper",
          px: 1.5,
          py: 0.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{
            textDecoration: "underline",
            cursor: "pointer",
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          View
        </Typography>
      </Box>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {TOGGLE_ITEMS.map((item) => (
          <MenuItem key={item.key} onClick={() => toggle(item.key)}>
            <ListItemIcon>{visibility[item.key] && <CheckIcon fontSize="small" />}</ListItemIcon>
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Box sx={{ flex: 1, minHeight: 0, p: 1, boxSizing: "border-box" }}>
        <TransmitLog overrideVisibility={visibility} />
      </Box>
    </Box>
  );
};

export default EventLogWindow;
