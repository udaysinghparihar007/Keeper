"use client";

import Link from "next/link";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface SavePermanentlyDialogProps {
  open: boolean;
  onClose: () => void;
  hasNotes: boolean;
}

export default function SavePermanentlyDialog({
  open,
  onClose,
  hasNotes,
}: SavePermanentlyDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Keep your notes permanently</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your notes are currently saved temporarily on this device.
        </Typography>
        <Typography component="div" variant="body2">
          Create a free Keeper account to:
          <br />• Keep your notes permanently
          <br />• Access them from other devices
          <br />• Continue where you left off
        </Typography>
        {hasNotes && (
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
            Your existing guest notes will be ready to import after you sign in.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button component={Link} href="/sign-up?intent=save" variant="contained">
          Create free account
        </Button>
        <Button component={Link} href="/login?intent=save" onClick={onClose}>
          Log in
        </Button>
        <Button onClick={onClose}>Continue as guest</Button>
      </DialogActions>
    </Dialog>
  );
}
