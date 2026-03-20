create table if not exists webhook_event_claims (
  stripe_event_id text primary key,
  claim_token text not null,
  claimed_at text not null,
  claim_expires_at text not null
);

create index if not exists idx_webhook_event_claims_claim_expires_at
  on webhook_event_claims (claim_expires_at);
