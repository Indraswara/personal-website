# Ephemeral hobby-OS instance — a real bare-metal x86 OS
# (projects/os-2024-lostonesweeping) booted per session under QEMU (TCG, no
# /dev/kvm) and torn down on exit by the terminal backend's sandbox
# orchestrator, the same way the plain shell playground is. Build context
# MUST be the repo root:
#   docker build -t egolab-os:latest -f os/Dockerfile .

# ---- stage 1: build the OS image (bootloader, kernel, disk, userspace) ----
FROM debian:bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential nasm genisoimage qemu-utils \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /build/os
COPY projects/os-2024-lostonesweeping ./
# `restart` = clean + 4M disk image + inserter tool + inject the userspace
# shell; `insert-clock` layers the clock program onto the same disk; `iso`
# links the kernel and packs the GRUB-bootable ISO. Order matters — iso must
# come last so it doesn't get wiped by `restart`'s clean step, and disk must
# come before either insert target so there's something to insert into.
RUN make restart && make insert-clock && make iso \
 && test -f bin/OS2024.iso && test -f bin/storage.bin

# ---- stage 2: minimal QEMU runtime ----
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      qemu-system-x86 ncurses-base \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /build/os/bin/OS2024.iso  /opt/os/OS2024.iso
# storage.bin is a seed, copied fresh per session by the entrypoint — never
# run QEMU directly against this file, or concurrent guests would share (and
# corrupt) one filesystem.
COPY --from=build /build/os/bin/storage.bin /opt/os/storage.seed.bin
COPY os/entrypoint.sh /usr/local/bin/os-entrypoint

RUN chmod +x /usr/local/bin/os-entrypoint \
 && useradd --uid 1000 --create-home --home-dir /home/guest --shell /bin/sh guest

USER guest
WORKDIR /home/guest
# Without a UTF-8 locale, ncurses can't map the guest's CP437 glyph table
# (the boot menu's box-drawing chars, VGA smileys, etc.) and floods stderr
# with one "Could not convert ..." line per glyph on every curses init.
ENV HOME=/home/guest LANG=C.UTF-8
CMD ["/usr/local/bin/os-entrypoint"]
