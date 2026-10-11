import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
async function sha512(value: string) { const bytes = new TextEncoder().encode(value); const hash = await crypto.subtle.digest('SHA-512', bytes); return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join(''); }
Deno.serve(async req => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = await req.json().catch(() => null); if (!body?.order_id || !body?.signature_key) return json({ error: 'Invalid notification' }, 400);
  const key = Deno.env.get('MIDTRANS_SERVER_KEY'); if (!key) return json({ error: 'Webhook is not configured' }, 503);
  const expected = await sha512(`${body.order_id}${body.status_code}${body.gross_amount}${key}`);
  if (expected !== String(body.signature_key).toLowerCase()) return json({ error: 'Invalid signature' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: payment, error } = await admin.from('rentgo_payments').select('*').eq('order_id', String(body.order_id)).maybeSingle();
  if (error || !payment) return json({ error: 'Payment not found' }, 404);
  if (Number(body.gross_amount) !== Number(payment.amount)) return json({ error: 'Amount mismatch' }, 400);
  let status = 'pending';
  if (body.transaction_status === 'settlement' || (body.transaction_status === 'capture' && body.fraud_status === 'accept')) status = 'paid';
  else if (['deny','cancel','expire'].includes(body.transaction_status)) status = body.transaction_status === 'expire' ? 'expired' : body.transaction_status === 'cancel' ? 'cancelled' : 'failed';
  // Idempotent status update; duplicate notifications do not create ledger entries.
  const update: Record<string, unknown> = { status, midtrans_transaction_id: body.transaction_id || null, notification_payload: body, updated_at: new Date().toISOString() };
  if (status === 'paid') update.paid_at = payment.paid_at || new Date().toISOString();
  const { error: updateError } = await admin.from('rentgo_payments').update(update).eq('order_id', payment.order_id);
  if (updateError) return json({ error: 'Could not update payment' }, 500);

  // Once Midtrans confirms payment, move the rental into the pickup workflow.
  // Do this only on the first transition to paid to keep webhook retries idempotent.
  if (status === 'paid' && payment.status !== 'paid') {
    const { data: rentalRow, error: rentalError } = await admin.from('rentals').select('id,buyer_id,seller_id,rental_data').eq('id', String(payment.rental_id)).maybeSingle();
    if (rentalError) return json({ error: 'Payment verified but rental lookup failed' }, 500);
    if (rentalRow?.rental_data) {
      const rentalData = { ...rentalRow.rental_data, status: 'booked', paymentStatus: 'paid', paidAt: new Date().toISOString(), paymentMethod: 'Midtrans' };
      const { error: rentalUpdateError } = await admin.from('rentals').update({ status: 'booked', rental_data: rentalData, updated_at: new Date().toISOString() }).eq('id', String(payment.rental_id));
      if (rentalUpdateError) return json({ error: 'Payment verified but rental status update failed' }, 500);
      const now = new Date().toISOString();
      const notifications = [
        { id: crypto.randomUUID(), user_id: String(payment.buyer_id), type: 'payment', title: 'Pembayaran Berhasil', message: `Pembayaran rental ${rentalData.motorName || 'motor'} berhasil. Silakan koordinasikan pengambilan motor dengan penyedia.`, rental_id: String(payment.rental_id), is_read: false, created_at: now },
        { id: crypto.randomUUID(), user_id: String(payment.seller_id), type: 'booking', title: 'Booking Dibayar', message: `Pembayaran untuk ${rentalData.motorName || 'motor'} telah terverifikasi. Konfirmasi saat motor diambil.`, rental_id: String(payment.rental_id), is_read: false, created_at: now }
      ];
      const { error: notifError } = await admin.from('rentgo_notifications').insert(notifications);
      if (notifError) console.error('[midtrans-webhook] notification insert failed', notifError.message);
    }
  }
  // Seller funds are not withdrawable until the rental completion/release workflow is verified.
  return json({ received: true, status });
});
