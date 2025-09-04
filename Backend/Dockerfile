FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY . .

# Ensure Go modules are used
ENV GO111MODULE=on

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8081

CMD ["./main"]