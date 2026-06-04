package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/returnrider/email-worker/internal/config"
	"github.com/returnrider/email-worker/internal/consumer"
	"github.com/returnrider/email-worker/internal/syncer"
)

func main() {
	cfg := config.Load()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	log.Printf("ReturnRider email-worker starting (redis=%s)", cfg.RedisURL)

	s := syncer.New(cfg)
	c := consumer.New(cfg, s)

	go func() {
		if err := c.Run(ctx); err != nil {
			log.Fatalf("consumer error: %v", err)
		}
	}()

	// Health heartbeat
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				log.Printf("email-worker alive")
			}
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Println("shutting down")
	cancel()
}

// JobPayload matches API enqueued jobs
type JobPayload struct {
	LinkedEmailID string `json:"linkedEmailId"`
}

func marshalJob(p JobPayload) []byte {
	b, _ := json.Marshal(p)
	return b
}
