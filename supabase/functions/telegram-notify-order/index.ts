// Supabase Edge Function: telegram-notify-order
// Sends a Telegram message to the admin group when a new order is created,
// with an inline "Confirm Order" button that triggers telegram-webhook.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function fmtPHP(n: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n || 0);
}

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMessage(order: any): string {
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  const lines = items.map((it: any) => {
    const name = escapeHtml(it.product_name || 'Item');
    const variation = it.variation_name ? ` (${escapeHtml(it.variation_name)})` : '';
    return `• ${name}${variation} × ${it.quantity} — ${fmtPHP(it.total)}`;
  });
  const subtotal = Number(order.total_price || 0);
  const shipping = Number(order.shipping_fee || 0);
  const grand = subtotal + shipping;
  const addr = [
    order.shipping_address,
    order.shipping_barangay,
    order.shipping_city,
    order.shipping_state,
    order.shipping_zip_code,
  ].filter(Boolean).map(escapeHtml).join(', ');

  return [
    `🛒 <b>New Order</b> #${escapeHtml(String(order.id).slice(0, 8))}`,
    ``,
    `<b>Customer:</b> ${escapeHtml(order.customer_name || '')}`,
    `<b>Email:</b> ${escapeHtml(order.customer_email || '')}`,
    `<b>Phone:</b> ${escapeHtml(order.customer_phone || '')}`,
    order.contact_method ? `<b>Contact via:</b> ${escapeHtml(order.contact_method)}` : '',
    ``,
    `<b>Items:</b>`,
    ...lines,
    ``,
    `<b>Subtotal:</b> ${fmtPHP(subtotal)}`,
    `<b>Shipping:</b> ${fmtPHP(shipping)} ${order.shipping_location ? `(${escapeHtml(order.shipping_location)})` : ''}`,
    `<b>Total:</b> ${fmtPHP(grand)}`,
    ``,
    `<b>Payment:</b> ${escapeHtml(order.payment_method_name || '—')}`,
    `<b>Address:</b> ${addr}`,
    order.notes ? `<b>Notes:</b> ${escapeHtml(order.notes)}` : '',
    ``,
    `<b>Status:</b> ${escapeHtml(order.order_status || 'new')}`,
  ].filter(Boolean).join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), { status: 400, headers: CORS });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: order, error } = await admin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: error?.message || 'order not found' }), { status: 404, headers: CORS });
    }

    const text = buildMessage(order);
    const reply_markup = {
      inline_keyboard: [[
        { text: '✅ Confirm Order', callback_data: `confirm:${order.id}` },
        { text: '❌ Cancel', callback_data: `cancel:${order.id}` },
      ]],
    };

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_GROUP_CHAT_ID,
        text,
        parse_mode: 'HTML',
        reply_markup,
      }),
    });

    const tgJson = await tgRes.json();
    if (!tgJson.ok) {
      console.error('Telegram error', tgJson);
      return new Response(JSON.stringify({ error: 'telegram send failed', details: tgJson }), { status: 502, headers: CORS });
    }

    const messageId = tgJson.result?.message_id;
    if (messageId) {
      await admin.from('orders').update({ telegram_message_id: messageId }).eq('id', order.id);
    }

    // Send payment proof image as a follow-up if available
    if (order.payment_proof_url) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_GROUP_CHAT_ID,
          photo: order.payment_proof_url,
          caption: `Payment proof for order #${String(order.id).slice(0, 8)}`,
          reply_to_message_id: messageId,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true, message_id: messageId }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
