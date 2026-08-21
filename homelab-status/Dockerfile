FROM golang:1.23 AS build
WORKDIR /app
COPY homelab-status/go.mod ./
COPY homelab-status/main.go ./
RUN CGO_ENABLED=0 go build -o /out/homelab-status .

FROM alpine:3.20
COPY --from=build /out/homelab-status /usr/local/bin/homelab-status
USER nobody
ENTRYPOINT ["/usr/local/bin/homelab-status"]
