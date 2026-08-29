import * as React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import useStore from "../../shared/hooks/useStore";
import { THEMES, DEFAULT_THEME_NAME } from "../../main/utils/themes";

const Theme = (props: React.PropsWithChildren) => {
  const { settings } = useStore();
  const preset = THEMES[settings.themeName] ?? THEMES[DEFAULT_THEME_NAME];

  return (
    <ThemeProvider
      theme={createTheme({
        palette: {
          mode: preset.mode,
          background: preset.background,
          primary: { main: preset.primary },
          secondary: { main: preset.secondary },
          success: { main: preset.success },
          divider: preset.divider,
          text: preset.text,
        },
        typography: {
          fontFamily: [
            "Inter",
            "-apple-system",
            "BlinkMacSystemFont",
            "Segoe UI",
            "Roboto",
            "sans-serif",
          ].join(","),
        },
        shape: {
          borderRadius: 4,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      })}
    >
      <CssBaseline />
      {props.children}
    </ThemeProvider>
  );
};

export default Theme;
