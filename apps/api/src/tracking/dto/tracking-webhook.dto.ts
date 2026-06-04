export interface TrackingWebhookPayload {
  event_id: string;
  event_type: string;
  emitted_at: string;
  provider: string;
  tracker: {
    tracking_number: string;
    carrier: string;
    return_id?: string;
    status: string;
    status_detail?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    event_at: string;
  };
  raw?: Record<string, unknown>;
}
