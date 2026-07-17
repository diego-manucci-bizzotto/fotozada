// Keep in sync with `PRINT_COMPLETE_DELAY` in backend/worker.py (~line 44).
// The DNP DS-RX1's CUPS "completed" signal fires before the sheet physically
// finishes printing, so the worker pads a fixed wait after the CUPS job
// leaves the queue before marking a job `done`. If that env var is ever
// tuned for the deployed printer, update this value too.
export const PRINT_COMPLETE_DELAY_SECONDS = 30;
