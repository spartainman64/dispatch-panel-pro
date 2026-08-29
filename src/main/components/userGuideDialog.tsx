import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
};

const H = (props: { children: React.ReactNode }) => (
  <Typography variant="h6" sx={{ fontWeight: "bold", mt: 3, mb: 1 }}>
    {props.children}
  </Typography>
);

const P = (props: { children: React.ReactNode }) => (
  <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
    {props.children}
  </Typography>
);

const Sub = (props: { children: React.ReactNode }) => (
  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mt: 2, mb: 0.5 }}>
    {props.children}
  </Typography>
);

const Code = (props: { children: React.ReactNode }) => (
  <Box
    component="pre"
    sx={{
      backgroundColor: "action.hover",
      p: 1,
      borderRadius: 0.5,
      fontFamily: "monospace",
      fontSize: 12,
      overflowX: "auto",
      mb: 1.5,
    }}
  >
    {props.children}
  </Box>
);

const Li = (props: { children: React.ReactNode }) => (
  <Typography component="li" variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }}>
    {props.children}
  </Typography>
);

const UserGuideDialog = (props: Props) => {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>User Guide</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: "70vh" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A custom dispatch application for SonoranRadio and TeamSpeak, built for this community. Not
          affiliated with or supported by Sonoran Software.
        </Typography>

        <H>1. Overview</H>
        <P>CommsCenter:</P>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          <Li>Controls your SonoranRadio channel, scan list, and volume</Li>
          <Li>Jumps you between TeamSpeak channels (RTO, 911, 311, Priority) with one click, across any of the 3 patrol servers</Li>
          <Li>Detects when a civilian joins a 911/311/Priority channel and alerts you with a sound and a flashing button</Li>
          <Li>Shows who's calling, lets you manage the Civ Group waiting list, and lets you poke/release civilians</Li>
          <Li>Logs radio activity with location/postal info, color-coded by tuned vs. scanned channel</Li>
          <Li>Pops up a dismissable alert when someone messages you on TeamSpeak</Li>
        </Box>
        <P>
          It talks to two separate local systems: the SonoranRadio TS3 plugin (radio simulation) and
          TeamSpeak's own ClientQuery interface (channel control, moving people, pokes, messages).
        </P>

        <H>2. Running the App</H>
        <Code>{`npm install       (first time only, or after an update)\nnpm start`}</Code>
        <P>
          <strong>Requirements:</strong> TeamSpeak 3 must be open, the SonoranRadio plugin must be
          loaded, and ClientQuery must be enabled (TeamSpeak Settings → Addons → Plugins → ClientQuery)
          for all TS3 features.
        </P>
        <P>
          Press <strong>Ctrl+Shift+I</strong> anytime to open/close DevTools. TS3 polling errors print
          to the terminal running <code>npm start</code>, not DevTools.
        </P>

        <H>3. Interface Overview</H>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          <Li><strong>Top Bar</strong> — menus, unit count, clock, mute button, quick-jump buttons</Li>
          <Li><strong>Radio Channels</strong> — your SonoranRadio channel grid (top left)</Li>
          <Li><strong>Channel Information</strong> — RTO occupants and radio frequencies (top right)</Li>
          <Li><strong>Selected Channel</strong> — signal bars (bottom left)</Li>
          <Li><strong>Event Log</strong> — scrolling transmission table (bottom middle)</Li>
          <Li><strong>Call Center</strong> — Civilians / Call Line tabs (bottom right)</Li>
        </Box>

        <H>4. Radio Channels</H>
        <P>
          Each tile shows a category-colored left strip, a scan checkbox, the channel name, its
          frequency in MHz, and a live count of people tuned to it. Click a tile to switch your main
          channel; check its box to scan it. Scanning toggles via the green/red button in the header.
        </P>
        <Sub>Categories (case-insensitive)</Sub>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          <Li>POLICE / LAW — blue</Li>
          <Li>TACTICAL / TAC — amber</Li>
          <Li>FIRE/EMS — red</Li>
          <Li>INTEROP — purple</Li>
          <Li>SERVICE / OTHER — green</Li>
          <Li>Anything else — gray, shown as typed</Li>
        </Box>
        <Sub>Optional per-channel config.json fields</Sub>
        <Code>{`{ "name": "...", "xmit": [150,250], "recv": [30,250],\n  "category": "POLICE", "tg": "TG 101", "description": "..." }`}</Code>

        <H>5. TeamSpeak Quick-Jump Buttons</H>
        <P>
          Left to right: <strong>RTO</strong> (blue) — <strong>LOS SANTOS</strong> [911][311] —{" "}
          <strong>BLAINE COUNTY</strong> [911][311] — <strong>PRIORITY 911</strong>. Call buttons are
          green by default, red and flashing when someone's waiting.
        </P>
        <P>
          <strong>Left-click</strong> moves you there and acknowledges any flash.{" "}
          <strong>Right-click</strong> a flashing button to clear it without moving.
        </P>
        <Sub>Server detection</Sub>
        <P>
          All 3 servers live on one TeamSpeak server, in separate sections. Clicking a button finds
          which patrol group you're in and uses that server's channel ID, so the same buttons work no
          matter which section you're in.
        </P>
        <Sub>Pending call detection</Sub>
        <P>
          Checked every 2 seconds. Dispatchers are excluded if their name contains a callsign like{" "}
          <code>C-100</code>/<code>E-303</code>, or a tag: <code>[P] [S] [T] [FIRE] [911] [TAC] [SA] [E]</code>.
          A flash plays its tone once per activation. If another dispatcher joins that channel, the
          flash clears automatically and silently.
        </P>

        <H>6. Channel Information</H>
        <P>
          Shows everyone in the RTO channel and their radio frequency. SonoranRadio only shares this
          for people in your own current TeamSpeak channel, so it only works while you're personally
          in RTO — otherwise it shows an explanatory message instead of an empty list.
        </P>

        <H>7. Signal Bars</H>
        <P>
          TUNED and SCANNED bars fill red→yellow→green by tower quality. Fellow dispatchers always
          show 99%, since they usually have no real in-game tower data.
        </P>

        <H>8. Event Log</H>
        <P>
          Time / Channel / Identifier / Location. Green row = active on your tuned channel, blue =
          scanned channel. Location shows as <code>Name (Postal)</code>.
        </P>
        <P>
          <strong>View → Event Log...</strong>: Can Hear filter (on by default), independent column
          toggles, and Open in New Window (a popout with its own independent settings, sharing live
          data — good for recording).
        </P>

        <H>9. Call Center</H>
        <P>Two tabs, bottom right. Its header shows your live connection status.</P>
        <Sub>CIVILIANS tab</Sub>
        <P>
          Everyone in the Civ Group waiting channel for your server, no name filtering. Right-click →{" "}
          <strong>Request Callback</strong> pokes them with a configurable message.
        </P>
        <Sub>CALL LINE tab</Sub>
        <P>
          Everyone in your current call channel. Select a name, then <strong>Call Trace</strong>{" "}
          (pokes them) or <strong>Release</strong> (sends them back to Civ Group). Auto-switches to
          this tab the moment you join a call channel.
        </P>

        <H>10. Message Popup</H>
        <P>
          Incoming private TeamSpeak messages pop up as a dismissable banner at the top of the window,
          regardless of which panel you're on. Multiple messages queue up. Incoming pokes triggering
          this is unconfirmed — check the terminal for <code>[TS3 notification - unhandled]</code> if
          one doesn't show.
        </P>

        <H>11. Configuration Menu</H>
        <Sub>Websocket Settings...</Sub>
        <P>
          SonoranRadio plugin address (default <code>ws://[::1]:33802</code>). The only settings screen
          that needs a full reload to apply.
        </P>
        <Sub>Date & Time...</Sub>
        <P>Time/date format, Show Seconds/Date/Time Zone toggles, and a timezone dropdown (System Default, US zones, UTC, major international zones).</P>
        <Sub>Theme...</Sub>
        <P>Navy (default), Forest, Daylight.</P>
        <Sub>TeamSpeak Settings...</Sub>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          <Li>ClientQuery API Key</Li>
          <Li>Call Trace Message / Request Callback Message — editable poke text</Li>
          <Li>Fetch Channel List — pulls the current server's full channel tree</Li>
          <Li>3 server tabs: Patrol Group Channel, RTO Channel, Civilian Waiting Channel, and the 5 call channels</Li>
        </Box>
        <Sub>Sounds...</Sub>
        <P>
          A volume slider (0–100%) plus 5 independent alert slots (LS 911/311, Blaine 911/311,
          Priority). Each: Choose File, Test, Reset to Default.
        </P>

        <H>12. View Menu</H>
        <P>Event Log... — see Section 8.</P>

        <H>13. File Menu</H>
        <P>
          <strong>Backup Configuration...</strong> saves everything to one JSON file.{" "}
          <strong>Restore Configuration...</strong> loads a backup after confirmation.
        </P>

        <H>14. Mute Button</H>
        <P>
          Speaker icon left of the clock. Mutes/unmutes alert tones — buttons still flash normally when
          muted. Resets to unmuted every restart.
        </P>

        <H>15. Data Files</H>
        <P>
          <code>%APPDATA%\\CommsCenter\\</code>: <code>config.json</code> (channels),{" "}
          <code>locations.json</code>, <code>postals.json</code>, <code>settings.json</code> (all app
          settings). Settings updates merge in new fields without wiping existing ones.
        </P>

        <H>16. Troubleshooting</H>
        <Box component="ul" sx={{ pl: 2.5, mb: 1.5 }}>
          <Li><strong>No channels configured</strong> — config.json missing/empty; restore from backup or re-add</Li>
          <Li><strong>Generic postal codes</strong> — real postals.json not placed yet</Li>
          <Li><strong>Buttons don't move you</strong> — check API key and channel/group IDs for your current server</Li>
          <Li><strong>Flash but no tone</strong> — Windows Sound settings → Communications tab (Win+R → mmsys.cpl), set to "Do nothing"</Li>
          <Li><strong>Channel Information shows a message</strong> — you need to be in RTO yourself to see frequencies</Li>
        </Box>

        <H>17. Credits</H>
        <P>
          Built on the open-source Dispatch Panel project (GPL-3.0) by jamesg31 on GitHub, substantially
          redesigned and extended for this community's SonoranRadio + TeamSpeak setup.
        </P>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserGuideDialog;
