import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";

const SEGMENTS = 24;

type Props = {
  label: string;
  /** Signal quality 0-1, or null when idle/no active signal. */
  value: number | null;
};

// Interpolates red -> yellow -> green based on position (0 = left/poor, 1 = right/strong).
const segmentColor = (ratio: number): string => {
  const red = { r: 239, g: 68, b: 68 };
  const yellow = { r: 234, g: 179, b: 8 };
  const green = { r: 34, g: 197, b: 94 };

  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

  if (ratio <= 0.5) {
    const t = ratio / 0.5;
    return `rgb(${lerp(red.r, yellow.r, t)}, ${lerp(red.g, yellow.g, t)}, ${lerp(red.b, yellow.b, t)})`;
  }
  const t = (ratio - 0.5) / 0.5;
  return `rgb(${lerp(yellow.r, green.r, t)}, ${lerp(yellow.g, green.g, t)}, ${lerp(yellow.b, green.b, t)})`;
};

const SignalBar = (props: Props) => {
  const filledCount = props.value == null ? 0 : Math.round(props.value * SEGMENTS);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {props.label}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {props.value == null ? "STANDBY" : `${Math.round(props.value * 100)}%`}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.3} sx={{ mt: 1 }}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filledCount;
          return (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 20,
                borderRadius: 0.5,
                backgroundColor: isFilled ? segmentColor(i / (SEGMENTS - 1)) : "action.hover",
                transition: "background-color 200ms ease",
              }}
            />
          );
        })}
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.25 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>
          POOR
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10 }}>
          STRONG
        </Typography>
      </Stack>
    </Box>
  );
};

export default SignalBar;
