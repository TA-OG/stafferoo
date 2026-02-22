-- Migration: 0024_chat_messages
-- Description: Booking-scoped chat between settings and staff. Messages are
--              only allowed between participants of a confirmed booking,
--              enforced by RLS.
--
-- Reversibility:
--   drop table if exists chat_messages cascade;

-- ============================================================================
-- 1. CHAT_MESSAGES TABLE
-- ============================================================================
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  sender_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_chat_messages_booking    on chat_messages(booking_id, created_at);
create index if not exists idx_chat_messages_sender     on chat_messages(sender_id);
create index if not exists idx_chat_messages_unread     on chat_messages(booking_id)
  where read_at is null;

alter table chat_messages enable row level security;

-- Booking participants can read messages
drop policy if exists "Booking participants can select messages" on chat_messages;
create policy "Booking participants can select messages"
  on chat_messages for select
  using (
    exists (
      select 1 from bookings b
      where b.id = chat_messages.booking_id
        and (
          b.setting_id = auth.uid()
          or b.primary_staff_id = auth.uid()
          or b.secondary_staff_id = auth.uid()
          or b.assigned_staff_id = auth.uid()
        )
    )
  );

-- Booking participants can send messages
drop policy if exists "Booking participants can insert messages" on chat_messages;
create policy "Booking participants can insert messages"
  on chat_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from bookings b
      where b.id = chat_messages.booking_id
        and (
          b.setting_id = auth.uid()
          or b.primary_staff_id = auth.uid()
          or b.secondary_staff_id = auth.uid()
          or b.assigned_staff_id = auth.uid()
        )
    )
  );

-- Recipients can mark messages as read
drop policy if exists "Recipients can update read_at" on chat_messages;
create policy "Recipients can update read_at"
  on chat_messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = chat_messages.booking_id
        and (
          b.setting_id = auth.uid()
          or b.primary_staff_id = auth.uid()
          or b.secondary_staff_id = auth.uid()
          or b.assigned_staff_id = auth.uid()
        )
    )
  );

-- Admins full read
drop policy if exists "Admins can select all chat messages" on chat_messages;
create policy "Admins can select all chat messages"
  on chat_messages for select
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

comment on table chat_messages is 'In-app messaging scoped to a confirmed booking — only participants can read/write.';
comment on column chat_messages.read_at is 'Null until the non-sender participant reads the message.';


-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
notify pgrst, 'reload schema';
