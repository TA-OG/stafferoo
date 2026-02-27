'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

interface Message {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  isMe: boolean;
  readAt: string | null;
  createdAt: string;
}

interface BookingChatProps {
  /** ID of an existing confirmed booking (legacy chat). */
  bookingId?: string;
  /** ID of a booking_response (application-stage chat). */
  applicationId?: string;
}

export default function BookingChat({ bookingId, applicationId }: BookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Track chatOpen in a ref so the polling callback doesn't re-register
  const chatOpenRef = useRef(true);

  const apiUrl = applicationId
    ? `/api/applications/${applicationId}/chat`
    : `/api/bookings/${bookingId}/chat`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (json.ok) {
        setMessages(json.data?.messages || []);
        // Application chat includes chatOpen / expiresAt; booking chat does not.
        if (typeof json.data?.chatOpen === 'boolean') {
          setChatOpen(json.data.chatOpen);
          chatOpenRef.current = json.data.chatOpen;
        }
        if (json.data?.expiresAt) {
          setExpiresAt(json.data.expiresAt);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadMessages();
    // Poll every 10 s; once chatOpen becomes false the ref stops further fetches.
    const interval = setInterval(() => {
      if (chatOpenRef.current) loadMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      setContactError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ body: newMessage.trim() }),
      });

      const json = await res.json();

      if (!json.ok) {
        // Contact-detail violation — show inline error, keep the draft text
        if (json.error?.code === 'CONTACT_DETAILS_PROHIBITED') {
          setContactError(json.error.message);
          return;
        }
        setError(json.error?.message || 'Failed to send message');
        return;
      }

      setNewMessage('');
      if (json.data?.message) {
        setMessages((prev) => [...prev, json.data.message]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatExpiry = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });

  // Group messages by calendar date
  const groupedMessages = messages.reduce(
    (groups, msg) => {
      const key = new Date(msg.createdAt).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
      return groups;
    },
    {} as Record<string, Message[]>,
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#bf5d9f]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Chat</h3>
        <span className="text-xs text-gray-500">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Monitoring warning banner */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
        <span className="text-amber-600 text-sm flex-shrink-0" aria-hidden="true">⚠</span>
        <p className="text-xs text-amber-800">
          This chat is monitored. Sharing contact details (phone, email, social media) is a
          violation of platform Terms and is grounds for account removal.
        </p>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {formatDate(dateMessages[0].createdAt)}
                </span>
              </div>
              <div className="space-y-3">
                {dateMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.isMe
                          ? 'bg-[#bf5d9f] text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      {!msg.isMe && (
                        <p className="text-xs font-medium text-gray-500 mb-0.5">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.isMe ? 'justify-end' : ''}`}>
                        <span className={`text-xs ${msg.isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {msg.isMe && (
                          <span className={`text-xs ${msg.readAt ? 'text-white/70' : 'text-white/40'}`}>
                            {msg.readAt ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area — or expiry notice when chat is closed */}
      {chatOpen ? (
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          {contactError && (
            <div className="mb-2 rounded border border-red-300 bg-red-50 p-2">
              <p className="text-xs font-semibold text-red-700">Message blocked</p>
              <p className="text-xs text-red-600 mt-0.5">{contactError}</p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (contactError) setContactError(null);
              }}
              placeholder="Type a message..."
              maxLength={2000}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b49cdc] ${
                contactError ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-[#bf5d9f] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{newMessage.length}/2000</p>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-sm text-gray-600 font-medium">
            This chat closed 6 hours after the shift ended.
          </p>
          {expiresAt && (
            <p className="text-xs text-gray-400 mt-0.5">Closed {formatExpiry(expiresAt)}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Message history is preserved for your records.</p>
        </div>
      )}
    </div>
  );
}
