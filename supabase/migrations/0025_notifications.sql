-- Migration: 0025_notifications
-- Description: In-app notifications table. The staff_notification_preferences
--              table already exists (0015/0018) — this adds the actual
--              notification rows that drive the bell icon, email digests, etc.
--
-- Reversibility:
--   drop table if exists notifications cascade;

-- ============================================================================
-- 1. NOTIFICATIONS TABLE
-- ============================================================================
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  data        jsonb not null default '{}',
  channel     text not null default 'in_app'
                check (channel in ('in_app', 'email', 'sms', 'push')),
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user       on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread     on notifications(user_id)
  where read_at is null;
create index if not exists idx_notifications_type       on notifications(type);

alter table notifications enable row level security;

drop policy if exists "Users can select own notifications" on notifications;
create policy "Users can select own notifications"
  on notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Service role can insert notifications" on notifications;
create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);

drop policy if exists "Admins can select all notifications" on notifications;
create policy "Admins can select all notifications"
  on notifications for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table notifications is 'User-facing notification records — supports in-app, email, sms, and push channels.';
comment on column notifications.type is 'Machine-readable type, e.g. job_posted, booking_confirmed, reference_submitted, strike_issued';
comment on column notifications.data is 'Structured payload for deep-linking and rendering, e.g. { "booking_id": "..." }';
comment on column notifications.channel is 'Delivery channel: in_app (default), email, sms, push';
comment on column notifications.read_at is 'Null until the user views/dismisses the notification';
comment on column notifications.sent_at is 'Timestamp when the notification was dispatched (email sent, push fired, etc.)';


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
