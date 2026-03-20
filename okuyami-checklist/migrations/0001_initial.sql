create table if not exists purchases (
  id text primary key,
  email text,
  stripe_session_id text,
  status text not null,
  snapshot_json text not null,
  created_at text not null,
  paid_at text,
  delivery_email_sent_at text
);

create unique index if not exists idx_purchases_stripe_session_id
  on purchases (stripe_session_id);

create index if not exists idx_purchases_status_created_at
  on purchases (status, created_at);

create table if not exists analytics_events (
  id text primary key,
  event_name text not null,
  payload_json text not null,
  created_at text not null
);

create index if not exists idx_analytics_events_created_at
  on analytics_events (created_at desc);

create table if not exists processed_webhook_events (
  stripe_event_id text primary key,
  processed_at text not null
);
