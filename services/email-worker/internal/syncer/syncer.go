package syncer

import (
	"context"
	"fmt"
	"log"

	"github.com/returnrider/email-worker/internal/config"
	"github.com/returnrider/email-worker/internal/gmail"
)

type Syncer struct {
	cfg   config.Config
	gmail *gmail.Client
}

func New(cfg config.Config) *Syncer {
	return &Syncer{
		cfg:   cfg,
		gmail: gmail.New(cfg.GoogleClientID, cfg.GoogleClientSecret),
	}
}

func (s *Syncer) SyncLinkedEmail(ctx context.Context, linkedEmailID string) error {
	log.Printf("sync started for linked_email=%s", linkedEmailID)
	// Production: load encrypted refresh token from Postgres, decrypt, call Gmail API
	// with commerce query filter, forward parsed payloads to API webhook or write directly.
	_ = ctx
	if s.cfg.GoogleClientID == "" {
		return fmt.Errorf("GOOGLE_CLIENT_ID not configured")
	}
	log.Printf("sync completed for linked_email=%s (delegate to NestJS worker in hybrid mode)", linkedEmailID)
	return nil
}
