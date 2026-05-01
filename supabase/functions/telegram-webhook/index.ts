// Supabase Edge Function: telegram-webhook
// Receives Telegram updates (callback button presses) and updates order status.
// Only Telegram user IDs in TELEGRAM_ADMIN_IDS may confirm/cancel orders.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || '';
const TELEGRAM_ADMIN_IDS = (Deno.env.get('TELEGRAM_ADMIN_IDS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function tg(method: string, body: unknown) {
  return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req) => {
  // Telegram sends the configured secret in this header.
  if (TELEGRAM_WEBHOOK_SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== TELEGRAM_WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 });
    }
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  const cb = update.callback_query;
  if (!cb) {
    // Ignore non-callback updates (we only act on button presses).
    return new Response('ok');
  }

  const fromId = String(cb.from?.id ?? '');
  const data: string = cb.data || '';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;

  if (TELEGRAM_ADMIN_IDS.length && !TELEGRAM_ADMIN_IDS.includes(fromId)) {
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: 'You are not authorized to act on orders.',
      show_alert: true,
    });
    return new Response('ok');
  }

  const [action, orderId] = data.split(':');
  if (!orderId || (action !== 'confirm' && action !== 'cancel')) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Unknown action' });
    return new Response('ok');
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  const updates: Record<string, unknown> = { order_status: newStatus };
  if (action === 'confirm') updates.payment_status = 'paid';

  const { data: updated, error } = await admin
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select('id, order_status')
    .single();

  if (error || !updated) {
    await tg('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: `Failed: ${error?.message || 'order not found'}`,
      show_alert: true,
    });
    return new Response('ok');
  }

  const who = cb.from?.username ? `@${cb.from.username}` : (cb.from?.first_name || 'admin');
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const suffix = action === 'confirm'
    ? `\n\n✅ <b>Confirmed</b> by ${who} at ${stamp}`
    : `\n\n❌ <b>Cancelled</b> by ${who} at ${stamp}`;

  // Edit original message: keep text, drop buttons, append status line.
  const originalText: string = cb.message?.text || '';
  await tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: `${originalText}${suffix}`,
    parse_mode: 'HTML',
  });

  await tg('answerCallbackQuery', {
    callback_query_id: cb.id,
    text: action === 'confirm' ? 'Order confirmed' : 'Order cancelled',
  });

  return new Response('ok');
});
