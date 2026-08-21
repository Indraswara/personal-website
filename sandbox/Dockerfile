# Sandbox "playground" image — the ephemeral, network-isolated container the
# terminal backend spawns per session. Build context MUST be the repo root so
# it can see projects/ and labs/:
#   docker build -t egolab-sandbox:latest -f sandbox/Dockerfile .
#
# Hardening is applied at RUN time by the backend (no-egress network, read-only
# rootfs, tmpfs /home/guest, dropped caps, memory/pids/cpu limits, non-root).

# ---- stage 1: compile the C labs ----
FROM gcc:13 AS build
WORKDIR /build
COPY projects/sepotipai        ./sepotipai
COPY projects/if2110-tb-02-i   ./if2110
COPY projects/if2210-ngr       ./ngr
RUN cd sepotipai && make && test -x bin/main
RUN cd if2110 && make .bin/program && test -x .bin/program
# gcc:13's own libstdc++ is newer than debian:bookworm-slim's runtime one
# (GLIBCXX_3.4.32 missing there) — statically link this one binary instead of
# patching the upstream repo's Makefile or bumping the whole runtime image.
RUN cd ngr && make build CCX="g++ -static-libstdc++ -static-libgcc" && test -x bin/main

# ---- stage 2: minimal runtime ----
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash coreutils less \
      python3 python3-numpy python3-pillow python3-colorama \
 && rm -rf /var/lib/apt/lists/*

# Compiled C lab binaries + their runtime seed data.
COPY --from=build /build/sepotipai/bin/main    /opt/labs/sepotipai/main
COPY projects/sepotipai/data                   /opt/labs/sepotipai/data
COPY --from=build /build/if2110/.bin/program   /opt/labs/if2110/program
# BurBir prefixes whatever folder name it's given with its own "./config/"
# base (lib/Types/Application/simpan-dan-muat/muat.c), so an empty answer at
# the "folder konfigurasi" prompt resolves to exactly "./config/" — seed a
# valid empty config there so guests always load cleanly instead of hitting
# a missing-file path (format verified against simpan.c's SavingFile*: an
# empty section is written as a bare "0", no newline).
COPY sandbox/seed/burbir-config            /opt/labs/if2110/empty-config
COPY --from=build /build/ngr/bin/main      /opt/labs/ngr/main
COPY projects/if2210-ngr/example           /opt/labs/ngr/example

# Python labs.
COPY projects/html-checker/main.py         /opt/labs/html-checker/main.py
COPY projects/html-checker/PDA.py          /opt/labs/html-checker/PDA.py
COPY projects/html-checker/ConfigParser.py /opt/labs/html-checker/ConfigParser.py
COPY projects/html-checker/pda.txt         /opt/labs/html-checker/pda.txt
COPY projects/html-checker/test            /opt/labs/html-checker/test
COPY labs/citra-digital/citra.py           /opt/labs/citra-digital/citra.py
COPY projects/citra-digital/testing        /opt/labs/citra-digital/samples

# Wrappers, banner, guest reference material.
COPY sandbox/bin/            /usr/local/bin/
COPY sandbox/motd           /etc/motd
COPY sandbox/guest.bashrc   /etc/guest.bashrc
COPY sandbox/README.guest   /opt/egolab/README.guest
COPY sandbox/cv.txt         /opt/egolab/cv.txt

RUN chmod +x /usr/local/bin/* \
 && useradd --uid 1000 --create-home --home-dir /home/guest --shell /bin/bash guest

USER guest
WORKDIR /home/guest
ENV HOME=/home/guest LANG=C.UTF-8
# Interactive login shell that sources the guest rc (PATH, prompt, MOTD).
CMD ["/bin/bash", "--rcfile", "/etc/guest.bashrc", "-i"]
