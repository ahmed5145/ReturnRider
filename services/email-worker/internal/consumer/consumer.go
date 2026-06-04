package consumer

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/returnrider/email-worker/internal/config"
	"github.com/returnrider/email-worker/internal/syncer"
)

// BullMQ uses prefix bull:email-sync:
const queueKey = "bull:email-sync:wait"

type Consumer struct {
	cfg    config.Config
	syncer *syncer.Syncer
	rdb    *redis.Client
}

func New(cfg config.Config, s *syncer.Syncer) *Consumer {
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Printf("redis parse error: %v, using localhost", err)
		opt = &redis.Options{Addr: "localhost:6379"}
	}
	return &Consumer{
		cfg:    cfg,
		syncer: s,
		rdb:    redis.NewClient(opt),
	}
}

type jobEnvelope struct {
	Name string `json:"name"`
	Data struct {
		LinkedEmailID string `json:"linkedEmailId"`
	} `json:"data"`
}

func (c *Consumer) Run(ctx context.Context) error {
	log.Println("polling Redis for email-sync jobs (BullMQ compatible)")
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			result, err := c.rdb.BRPop(ctx, 2*time.Second, queueKey).Result()
			if err == redis.Nil {
				time.Sleep(1 * time.Second)
				continue
			}
			if err != nil {
				time.Sleep(2 * time.Second)
				continue
			}
			if len(result) < 2 {
				continue
			}
			var job jobEnvelope
			if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
				log.Printf("invalid job payload: %v", err)
				continue
			}
			if job.Data.LinkedEmailID != "" {
				if err := c.syncer.SyncLinkedEmail(ctx, job.Data.LinkedEmailID); err != nil {
					log.Printf("sync error %s: %v", job.Data.LinkedEmailID, err)
				}
			}
		}
	}
}
