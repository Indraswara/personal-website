# Interactive shell setup for the sandbox guest.
export PATH="/usr/local/bin:/opt/labs/bin:/usr/bin:/bin"
export PS1='\[\e[38;5;42m\]guest@egolab\[\e[0m\]:\[\e[38;5;39m\]\w\[\e[0m\]$ '
export PYTHONDONTWRITEBYTECODE=1
alias ll='ls -la'
cd "$HOME" 2>/dev/null || true
# $HOME is a tmpfs at runtime (empty), so seed it from the read-only image.
[ -f "$HOME/README" ] || cp /opt/egolab/README.guest "$HOME/README" 2>/dev/null || true
[ -f "$HOME/cv.txt" ] || cp /opt/egolab/cv.txt "$HOME/cv.txt" 2>/dev/null || true
[ -f /etc/motd ] && cat /etc/motd
