import * as React from "react";
import TopBar from "./topBar";
import WorkspaceLayout from "./workspaceLayout";
import MessagePopup from "./messagePopup";
import SettingsDialog from "./settingsDialog";
import DateTimeSettingsDialog from "./dateTimeSettingsDialog";
import ThemeSettingsDialog from "./themeSettingsDialog";
import Ts3SettingsDialog from "./ts3SettingsDialog";
import EventLogSettingsDialog from "./eventLogSettingsDialog";
import SoundsSettingsDialog from "./soundsSettingsDialog";
import UserGuideDialog from "./userGuideDialog";
import useStore from "../../shared/hooks/useStore";
import { DEFAULT_DASHBOARD_LAYOUT } from "../../shared/dashboardLayout";
import { Box } from "@mui/material";

const ConfiguredApp = () => {
  const { settings, setSettings } = useStore();
  const [websocketSettingsOpen, setWebsocketSettingsOpen] = React.useState(false);
  const [dateTimeSettingsOpen, setDateTimeSettingsOpen] = React.useState(false);
  const [themeSettingsOpen, setThemeSettingsOpen] = React.useState(false);
  const [ts3SettingsOpen, setTs3SettingsOpen] = React.useState(false);
  const [eventLogSettingsOpen, setEventLogSettingsOpen] = React.useState(false);
  const [soundsSettingsOpen, setSoundsSettingsOpen] = React.useState(false);
  const [userGuideOpen, setUserGuideOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);

  const onResetLayout = () => {
    setSettings({ ...settings, dashboardLayout: DEFAULT_DASHBOARD_LAYOUT, hiddenPanels: [] });
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
      <Box sx={{ flexShrink: 0 }}>
        <TopBar
          onOpenWebsocketSettings={() => setWebsocketSettingsOpen(true)}
          onOpenDateTimeSettings={() => setDateTimeSettingsOpen(true)}
          onOpenThemeSettings={() => setThemeSettingsOpen(true)}
          onOpenTs3Settings={() => setTs3SettingsOpen(true)}
          onOpenEventLogSettings={() => setEventLogSettingsOpen(true)}
          onOpenSoundsSettings={() => setSoundsSettingsOpen(true)}
          onOpenUserGuide={() => setUserGuideOpen(true)}
          editMode={editMode}
          onToggleEditMode={() => setEditMode((prev) => !prev)}
          onResetLayout={onResetLayout}
        />
      </Box>

      <WorkspaceLayout editMode={editMode} />

      <SettingsDialog open={websocketSettingsOpen} onClose={() => setWebsocketSettingsOpen(false)} />
      <DateTimeSettingsDialog open={dateTimeSettingsOpen} onClose={() => setDateTimeSettingsOpen(false)} />
      <ThemeSettingsDialog open={themeSettingsOpen} onClose={() => setThemeSettingsOpen(false)} />
      <Ts3SettingsDialog open={ts3SettingsOpen} onClose={() => setTs3SettingsOpen(false)} />
      <EventLogSettingsDialog open={eventLogSettingsOpen} onClose={() => setEventLogSettingsOpen(false)} />
      <SoundsSettingsDialog open={soundsSettingsOpen} onClose={() => setSoundsSettingsOpen(false)} />
      <UserGuideDialog open={userGuideOpen} onClose={() => setUserGuideOpen(false)} />
      <MessagePopup />
    </Box>
  );
};

export default ConfiguredApp;
