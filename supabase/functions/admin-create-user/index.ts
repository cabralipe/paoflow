import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type StaffRole = 'attendant' | 'cashier' | 'admin';

interface CreateUserPayload {
  email?: string;
  password?: string;
  name?: string;
  role?: StaffRole;
  bakery_id?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Metodo nao permitido.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Variaveis SUPABASE_URL, SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY ausentes.' }, 500);
  }

  const authorization = req.headers.get('Authorization');
  if (!authorization) {
    return json({ error: 'Requisicao sem Authorization.' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await userClient.auth.getUser();
  if (callerError || !callerData.user) {
    return json({ error: 'Sessao invalida.' }, 401);
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, bakery_id, role, active')
    .eq('id', callerData.user.id)
    .single();

  if (profileError || !callerProfile?.active) {
    return json({ error: 'Perfil do solicitante nao autorizado.' }, 403);
  }

  const body = (await req.json().catch(() => ({}))) as CreateUserPayload;
  const email = body.email?.trim().toLowerCase();
  const password = body.password || '';
  const name = body.name?.trim();
  const requestedRole = body.role;

  if (!email || !password || !name || !requestedRole) {
    return json({ error: 'Informe nome, e-mail, senha e perfil.' }, 400);
  }

  if (!['attendant', 'cashier', 'admin'].includes(requestedRole)) {
    return json({ error: 'Perfil invalido para cadastro operacional.' }, 400);
  }

  if (password.length < 6) {
    return json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, 400);
  }

  const isSuperAdmin = callerProfile.role === 'superadmin';
  const isBakeryAdmin = callerProfile.role === 'admin';

  if (!isSuperAdmin && !isBakeryAdmin) {
    return json({ error: 'Apenas superadmin ou admin da padaria podem cadastrar usuarios.' }, 403);
  }

  if (isBakeryAdmin && requestedRole === 'admin') {
    return json({ error: 'Admin da padaria pode criar apenas atendentes e operadores de caixa.' }, 403);
  }

  const bakeryId = isSuperAdmin ? body.bakery_id : callerProfile.bakery_id;
  if (!bakeryId) {
    return json({ error: 'Informe a padaria do usuario.' }, 400);
  }

  const { data: bakery, error: bakeryError } = await adminClient
    .from('bakeries')
    .select('id, active')
    .eq('id', bakeryId)
    .single();

  if (bakeryError || !bakery?.active) {
    return json({ error: 'Padaria inexistente ou inativa.' }, 400);
  }

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: {
      paoflow_role: requestedRole,
      paoflow_bakery_id: bakeryId,
    },
  });

  if (createError || !createdUser.user) {
    return json({ error: createError?.message || 'Erro ao criar usuario Auth.' }, 400);
  }

  const { data: profile, error: insertError } = await adminClient
    .from('profiles')
    .insert({
      id: createdUser.user.id,
      bakery_id: bakeryId,
      name,
      role: requestedRole,
      active: true,
    })
    .select('*, bakery:bakeries(name, slug)')
    .single();

  if (insertError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id);
    return json({ error: insertError.message }, 400);
  }

  return json({ profile }, 201);
});
