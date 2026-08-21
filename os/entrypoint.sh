#!/bin/sh
# Copy the read-only seed disk into the writable tmpfs $HOME before every
# boot — QEMU opens the drive file read-write, and running two guests
# against the same seed would corrupt it for both. tmpfs is mounted noexec,
# but that only blocks execve() on files there; QEMU just reads/writes this
# one as data, so that restriction doesn't matter here.
set -e
export TMPDIR="$HOME"
disk="$HOME/storage.bin"
cp /opt/os/storage.seed.bin "$disk"

# No `-s -S` (that pauses the CPU waiting for a GDB attach — the makefile's
# own `run` target uses it for development, which would just hang here).
# `-display curses` renders the guest's VGA text-mode console as the actual
# terminal output, so it reaches the browser over the same PTY bridge as
# every other playground program.
exec qemu-system-i386 \
  -display curses \
  -drive file="$disk",format=raw,if=ide,index=0,media=disk \
  -cdrom /opt/os/OS2024.iso
