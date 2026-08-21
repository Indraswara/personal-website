# Predator-prey ABM, ported to a headless web service — see runner.py for
# why. Build context MUST be the repo root (needs projects/kds/agents.py):
#   docker build -t egolab-kds -f labs/kds/Dockerfile .
FROM python:3.12-slim
WORKDIR /app

RUN pip install --no-cache-dir fastapi==0.115.* "uvicorn[standard]==0.32.*"

# agents.py is vendored in unmodified from the upstream repo — the actual
# simulation logic (movement, energy, reproduction) is untouched student
# code; only runner.py (ours) drives it headlessly instead of gui.py's
# tkinter/matplotlib front end.
COPY projects/kds/agents.py ./agents.py
COPY labs/kds/runner.py     ./runner.py
COPY labs/kds/server.py     ./server.py
COPY labs/kds/static        ./static

EXPOSE 80
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "80"]
