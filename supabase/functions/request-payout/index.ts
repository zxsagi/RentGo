import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS' };
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type':'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error:'Method not allowed' },405);
  const auth = req.headers.get('Authorization'); if (!auth) return json({ error:'Authentication required' },401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global:{headers:{Authorization:auth}} });
  const { data:{user}, error:authError } = await caller.auth.getUser(); if (authError || !user) return json({error:'Invalid session'},401);
  const { amount } = await req.json().catch(()=>({})); if (!Number.isSafeInteger(amount) || amount < 10000) return json({error:'Nominal minimum penarikan adalah Rp10.000'},400);
  const { data: profile, error: pe } = await admin.from('profiles').select('role,bank_name,bank_account_number,bank_account_name').eq('id',user.id).maybeSingle();
  if (pe || !profile || profile.role !== 'seller') return json({error:'Akun penyedia tidak ditemukan'},403);
  if (!profile.bank_name || !profile.bank_account_number || !profile.bank_account_name) return json({error:'Lengkapi rekening bank pada profil terlebih dahulu'},422);
  // Safe default: never pretend a transfer occurred. Enable only after a real disbursement provider is contracted/configured.
  if (!Deno.env.get('PAYOUT_PROVIDER_URL') || !Deno.env.get('PAYOUT_PROVIDER_SECRET')) return json({error:'Penarikan otomatis belum diaktifkan: konfigurasi penyedia disbursement belum tersedia. Saldo tidak dipotong.', code:'PAYOUT_PROVIDER_NOT_CONFIGURED'},503);
  // Provider-specific API contract cannot be assumed. Deliberately fail closed until the provider adapter is implemented and tested.
  return json({error:'Penyedia disbursement terkonfigurasi tetapi adapter transfer belum diimplementasikan. Tidak ada transfer yang dikirim dan saldo tidak dipotong.',code:'PAYOUT_ADAPTER_REQUIRED'},501);
});
