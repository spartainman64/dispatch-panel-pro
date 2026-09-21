/** One panel's position/size on the customizable workspace, in react-grid-layout's format. */
export type DashboardLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** The 5 movable/hideable workspace panels. The top bar is fixed chrome, not part of this. */
export const WORKSPACE_PANEL_IDS = [
  "radio-channels",
  "channel-info",
  "selected-channel",
  "event-log",
  "call-center",
] as const;

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { i: "radio-channels", x: 0, y: 0, w: 9, h: 10 },
  { i: "channel-info", x: 9, y: 0, w: 3, h: 10 },
  { i: "selected-channel", x: 0, y: 10, w: 3, h: 8 },
  { i: "event-log", x: 3, y: 10, w: 6, h: 8 },
  { i: "call-center", x: 9, y: 10, w: 3, h: 8 },
];
