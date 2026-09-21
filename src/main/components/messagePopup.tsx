import * as React from "react";
import { Box, Alert, AlertTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type ReceivedMessage = { sender: string; message: string; timestamp: string };

const MessagePopup = () => {
  const [queue, setQueue] = React.useState<ReceivedMessage[]>([]);

  React.useEffect(() => {
    const unsubscribe = window.electron.ts3.onMessageReceived((msg) => {
      setQueue((prev) => [...prev, msg]);
    });
    return unsubscribe;
  }, []);

  const current = queue[0] ?? null;

  const dismiss = () => {
    setQueue((prev) => prev.slice(1));
  };

  if (!current) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2000,
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        action={
          <IconButton size="small" color="inherit" onClick={dismiss}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ minWidth: 320, pointerEvents: "auto", boxShadow: 6 }}
      >
        <AlertTitle sx={{ fontWeight: "bold" }}>{current.sender}</AlertTitle>
        {current.message}
      </Alert>
    </Box>
  );
};

export default MessagePopup;
