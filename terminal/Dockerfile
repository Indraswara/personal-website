FROM golang:1.23 AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/terminal .

FROM docker:25-cli
RUN apk add --no-cache ca-certificates
COPY --from=build /out/terminal /usr/local/bin/terminal
ENTRYPOINT ["/usr/local/bin/terminal"]
