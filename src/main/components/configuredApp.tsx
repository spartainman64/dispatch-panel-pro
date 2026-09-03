import * as React from "react";
import TopBar from "./topBar";
import TransmitLog from "./transmitLog";
import ChannelGrid from "./channelGrid";
import ChannelDetail from "./channelDetail";
import ChannelInfoPanel from "./channelInfoPanel";
import CallerInfoPanel from "./callerInfoPanel";
import MessagePopup from "./messagePopup";
import SettingsDialog from "./settingsDialog";
import DateTimeSettingsDialog from "./dateTimeSettingsDialog";
import ThemeSettingsDialog from "./themeSettingsDialog";
import Ts3SettingsDialog from "./ts3SettingsDialog";
import EventLogSettingsDialog from "./eventLogSettingsDialog";
import SoundsSettingsDialog from "./soundsSettingsDialog";
import UserGuideDialog from "./userGuideDialog";
import useStore from "../../shared/hooks/useStore";
import { Box } from "@mui/material";

const ConfiguredApp = () => {
  const { settings } = useStore();
  const [websocketSettingsOpen, setWebsocketSettingsOpen] = React.useState(false);
  const [dateTimeSettingsOpen, setDateTimeSettingsOpen] = React.useState(false);
  const [themeSettingsOpen, setThemeSettingsOpen] = React.useState(false);
  const [ts3SettingsOpen, setTs3SettingsOpen] = React.useState(false);
  const [eventLogSettingsOpen, setEventLogSettingsOpen] = React.useState(false);
  const [soundsSettingsOpen, setSoundsSettingsOpen] = React.useState(false);
  const [userGuideOpen, setUserGuideOpen] = React.useState(false);

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
        />
      </Box>

      <Box
        sx={{
          flex: "1 1 55%",
          minHeight: { xs: 700, md: 0 },
          flexShrink: 0,
          p: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "3fr 1fr" },
          gridAutoRows: "1fr",
          gap: 1,
        }}
      >
        {settings.frequenciesSection && <ChannelGrid />}
        <ChannelInfoPanel />
      </Box>

      <Box
        sx={{
          flex: "1 1 45%",
          minHeight: { xs: 900, md: 0 },
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr 1fr" },
          gridAutoRows: "1fr",
          gap: 1,
          p: 1,
          pt: 0,
        }}
      >
        {settings.frequenciesSection && <ChannelDetail />}
        {settings.transmitLogSection && <TransmitLog />}
        <CallerInfoPanel />
      </Box>

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
