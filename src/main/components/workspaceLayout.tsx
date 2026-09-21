import * as React from "react";
import GridLayout, { WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Box, IconButton, Tooltip, Stack, Typography, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import useStore from "../../shared/hooks/useStore";
import { DashboardLayoutItem, DEFAULT_DASHBOARD_LAYOUT, WORKSPACE_PANEL_IDS } from "../../shared/dashboardLayout";
import ChannelGrid from "./channelGrid";
import ChannelInfoPanel from "./channelInfoPanel";
import ChannelDetail from "./channelDetail";
import TransmitLog from "./transmitLog";
import CallerInfoPanel from "./callerInfoPanel";

const ReactGridLayout = WidthProvider(GridLayout);

const PANEL_LABELS: Record<string, string> = {
  "radio-channels": "Radio Channels",
  "channel-info": "Channel Information",
  "selected-channel": "Selected Channel",
  "event-log": "Event Log",
  "call-center": "Call Center",
};

const PANEL_COMPONENTS: Record<string, React.ComponentType> = {
  "radio-channels": ChannelGrid,
  "channel-info": ChannelInfoPanel,
  "selected-channel": ChannelDetail,
  "event-log": TransmitLog,
  "call-center": CallerInfoPanel,
};

// A couple of panels are also gated by older, pre-existing visibility
// settings (frequenciesSection / transmitLogSection). Respect those too,
// on top of the new per-panel hide/show workspace controls.
const PANEL_SETTINGS_GATE: Record<string, "frequenciesSection" | "transmitLogSection" | null> = {
  "radio-channels": "frequenciesSection",
  "selected-channel": "frequenciesSection",
  "event-log": "transmitLogSection",
  "channel-info": null,
  "call-center": null,
};

const ALL_PANEL_IDS: string[] = [...WORKSPACE_PANEL_IDS];

type Props = {
  editMode: boolean;
};

const WorkspaceLayout = (props: Props) => {
  const { settings, setSettings } = useStore();

  const layout = settings.dashboardLayout?.length ? settings.dashboardLayout : DEFAULT_DASHBOARD_LAYOUT;
  const hiddenPanels = settings.hiddenPanels ?? [];

  const visiblePanelIds = ALL_PANEL_IDS.filter((id) => {
    if (hiddenPanels.includes(id)) return false;
    const gate = PANEL_SETTINGS_GATE[id];
    if (gate && !settings[gate]) return false;
    return true;
  });

  const visibleLayout = layout.filter((item) => visiblePanelIds.includes(item.i));

  const onLayoutChange = (newLayout: Layout[]) => {
    if (!props.editMode) return;
    const updated: DashboardLayoutItem[] = newLayout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }));
    // Keep the last known position/size for anything currently hidden, so it
    // reappears where it was instead of resetting when shown again.
    const preserved = layout.filter((item) => !visiblePanelIds.includes(item.i));
    setSettings({ ...settings, dashboardLayout: [...updated, ...preserved] });
  };

  const onHidePanel = (id: string) => {
    setSettings({ ...settings, hiddenPanels: [...hiddenPanels, id] });
  };

  const onShowPanel = (id: string) => {
    setSettings({ ...settings, hiddenPanels: hiddenPanels.filter((h) => h !== id) });
  };

  const currentlyHidden = ALL_PANEL_IDS.filter((id) => hiddenPanels.includes(id));

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
      {props.editMode && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ px: 1, pt: 1, pb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
            {currentlyHidden.length > 0 ? "Add panel:" : "All panels visible."}
          </Typography>
          {currentlyHidden.map((id) => (
            <Button
              key={id}
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => onShowPanel(id)}
            >
              {PANEL_LABELS[id]}
            </Button>
          ))}
        </Stack>
      )}

      <ReactGridLayout
        className="workspace-grid"
        layout={visibleLayout}
        cols={12}
        rowHeight={30}
        margin={[8, 8]}
        containerPadding={[8, 8]}
        isDraggable={props.editMode}
        isResizable={props.editMode}
        resizeHandles={["s", "w", "e", "n", "sw", "nw", "se", "ne"]}
        draggableHandle=".panel-drag-handle"
        onLayoutChange={onLayoutChange}
        compactType="vertical"
      >
        {visiblePanelIds.map((id) => {
          const PanelComponent = PANEL_COMPONENTS[id];
          return (
            <Box
              key={id}
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: props.editMode ? "visible" : "hidden",
                position: "relative",
                outline: props.editMode ? "1px dashed" : "none",
                outlineColor: "primary.main",
              }}
            >
              {props.editMode && (
                <Box
                  className="panel-drag-handle"
                  sx={{
                    flexShrink: 0,
                    height: 24,
                    backgroundColor: "primary.dark",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 0.5,
                    cursor: "move",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <DragIndicatorIcon fontSize="small" sx={{ color: "#fff" }} />
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: "bold" }}>
                      {PANEL_LABELS[id]}
                    </Typography>
                  </Stack>
                  <Tooltip title="Hide panel">
                    <IconButton
                      size="small"
                      onClick={() => onHidePanel(id)}
                      onMouseDown={(e) => e.stopPropagation()}
                      sx={{ color: "#fff", p: 0.25 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <PanelComponent />
              </Box>
            </Box>
          );
        })}
      </ReactGridLayout>
    </Box>
  );
};

export default WorkspaceLayout;
