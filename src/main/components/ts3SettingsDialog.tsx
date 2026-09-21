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
  Select,
  MenuItem,
  Stack,
  Alert,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import useStore from "../../shared/hooks/useStore";
import { Ts3ServerProfile } from "../../config";
import { parseChannelList, Ts3Channel } from "../../shared/utils/ts3ChannelList";

type Props = {
  open: boolean;
  onClose: () => void;
};

const FIELDS: Array<{ key: keyof Omit<Ts3ServerProfile, "label">; label: string }> = [
  { key: "groupChannelId", label: "Patrol Group Channel (contains RTO)" },
  { key: "rtoChannelId", label: "RTO Channel" },
  { key: "civilianChannelId", label: "Civilian Waiting Channel" },
  { key: "civilianBusinessChannelId", label: "Civilian Business Communication" },
  { key: "losSantos911", label: "Los Santos 911" },
  { key: "losSantos311", label: "Los Santos 311" },
  { key: "blaineCounty911", label: "Blaine County 911" },
  { key: "blaineCounty311", label: "Blaine County 311" },
  { key: "priority911", label: "Priority 911" },
];

const Ts3SettingsDialog = (props: Props) => {
  const { settings, setSettings } = useStore();
  const [apiKey, setApiKey] = React.useState(settings.ts3ClientQueryApiKey);
  const [callTraceMessage, setCallTraceMessage] = React.useState(settings.callTraceMessage);
  const [requestCallbackMessage, setRequestCallbackMessage] = React.useState(settings.requestCallbackMessage);
  const [ignoredMessageSender, setIgnoredMessageSender] = React.useState(settings.ignoredMessageSender);
  const [profiles, setProfiles] = React.useState(settings.ts3ServerProfiles);
  const [activeTab, setActiveTab] = React.useState(0);
  const [availableChannels, setAvailableChannels] = React.useState<Ts3Channel[]>([]);
  const [fetchStatus, setFetchStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [fetchMessage, setFetchMessage] = React.useState("");

  React.useEffect(() => {
    if (props.open) {
      setApiKey(settings.ts3ClientQueryApiKey);
      setCallTraceMessage(settings.callTraceMessage);
      setRequestCallbackMessage(settings.requestCallbackMessage);
      setIgnoredMessageSender(settings.ignoredMessageSender);
      setProfiles(settings.ts3ServerProfiles);
      setAvailableChannels([]);
      setFetchStatus("idle");
    }
  }, [
    props.open,
    settings.ts3ClientQueryApiKey,
    settings.callTraceMessage,
    settings.requestCallbackMessage,
    settings.ignoredMessageSender,
    settings.ts3ServerProfiles,
  ]);

  const onFetchChannels = async () => {
    setFetchStatus("loading");
    const result = await window.electron.ts3.channelList();
    if (result.success) {
      const parsed = parseChannelList(result.data);
      setAvailableChannels(parsed);
      setFetchStatus("success");
      setFetchMessage(`Found ${parsed.length} channels. Fill in all 3 tabs from this same list below.`);
    } else {
      setFetchStatus("error");
      setFetchMessage(result.message || "Could not connect. Is ClientQuery enabled in TeamSpeak?");
    }
  };

  const onSave = () => {
    setSettings({
      ...settings,
      ts3ClientQueryApiKey: apiKey,
      callTraceMessage,
      requestCallbackMessage,
      ignoredMessageSender,
      ts3ServerProfiles: profiles,
    });
    props.onClose();
  };

  const updateProfile = (index: number, changes: Partial<Ts3ServerProfile>) => {
    setProfiles((prev) => prev.map((p, i) => (i === index ? { ...p, ...changes } : p)));
  };

  const currentProfile = profiles[activeTab];

  const channelLabel = (ch: Ts3Channel): string => {
    const parent = availableChannels.find((c) => c.id === ch.parentId);
    return parent ? `${parent.name} \u203a ${ch.name}` : ch.name;
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="xs" fullWidth>
      <DialogTitle>TeamSpeak Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Enable ClientQuery in TeamSpeak (Settings → Addons → Plugins → ClientQuery) to get an API
            key. Since all 3 sections live on the same TeamSpeak server, one "Fetch Channel List"
            covers everything - just fill in each of the 3 tabs below from that same list. The app
            figures out which section you're in by where your current channel sits in the tree, not
            by any channel's display name (so a changing queue count never matters).
          </Typography>

          <FormControl fullWidth>
            <FormLabel sx={{ mb: 1 }}>ClientQuery API Key</FormLabel>
            <TextField size="small" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ mb: 1 }}>Call Trace Message</FormLabel>
            <TextField
              size="small"
              value={callTraceMessage}
              onChange={(e) => setCallTraceMessage(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ mb: 1 }}>Request Callback Message</FormLabel>
            <TextField
              size="small"
              value={requestCallbackMessage}
              onChange={(e) => setRequestCallbackMessage(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ mb: 1 }}>Ignored Message Sender</FormLabel>
            <TextField
              size="small"
              value={ignoredMessageSender}
              onChange={(e) => setIgnoredMessageSender(e.target.value)}
              placeholder="e.g. 911 Bot"
              helperText="Messages from this exact name never trigger the popup"
            />
          </FormControl>

          <Button variant="outlined" onClick={onFetchChannels} disabled={fetchStatus === "loading"}>
            {fetchStatus === "loading" ? "Connecting..." : "Fetch Channel List"}
          </Button>

          {fetchStatus === "success" && <Alert severity="success">{fetchMessage}</Alert>}
          {fetchStatus === "error" && <Alert severity="error">{fetchMessage}</Alert>}

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth">
            {profiles.map((p, i) => (
              <Tab key={i} label={p.label} />
            ))}
          </Tabs>

          <TextField
            size="small"
            label="Server Label"
            value={currentProfile.label}
            onChange={(e) => updateProfile(activeTab, { label: e.target.value })}
          />

          {FIELDS.map((field) => (
            <FormControl fullWidth key={field.key}>
              <FormLabel sx={{ mb: 1 }}>{field.label}</FormLabel>
              {availableChannels.length > 0 ? (
                <Select
                  size="small"
                  displayEmpty
                  value={currentProfile[field.key] ?? ""}
                  onChange={(e) => updateProfile(activeTab, { [field.key]: e.target.value } as any)}
                >
                  <MenuItem value="">
                    <em>Not set</em>
                  </MenuItem>
                  {availableChannels.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>
                      {channelLabel(ch)}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <TextField
                  size="small"
                  placeholder="Channel ID"
                  value={currentProfile[field.key] ?? ""}
                  onChange={(e) => updateProfile(activeTab, { [field.key]: e.target.value } as any)}
                />
              )}
            </FormControl>
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

export default Ts3SettingsDialog;
