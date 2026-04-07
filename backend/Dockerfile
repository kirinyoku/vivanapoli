# Build stage
FROM golang:1.25-alpine AS builder

# Install build dependencies if needed
RUN apk add --no-cache git

WORKDIR /app

# Copy dependency files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application
# Use CGO_ENABLED=0 for a truly static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/main.go

# Final runtime stage
FROM alpine:latest

# Add ca-certificates for secure connections (e.g., calling Resend API)
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/server .

# Copy migrations (some deployments run migrations as part of startup)
COPY --from=builder /app/internal/db/migrations ./internal/db/migrations

# Expose the application port
EXPOSE 8080

# Run the server
CMD ["./server"]
