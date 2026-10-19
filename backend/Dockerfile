# ---- Build stage ----
FROM golang:1.27-alpine AS build
WORKDIR /src

# Copy dependency files first so Docker caches the download layer
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go test ./...
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /bin/server ./cmd/server

# ---- Runtime stage ----
FROM alpine:3.22
RUN adduser -D app
USER app
COPY --from=build /bin/server /server

EXPOSE 8080
CMD ["/server"]
