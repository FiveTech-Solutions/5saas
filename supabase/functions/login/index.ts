// supabase/functions/login/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';
import { pbkdf2 } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { promisify } from 'https://deno.land/std@0.168.0/node/util.ts';
import { create } from 'https://deno.land/x/djwt@v2.7/mod.ts';

const pbkdf2Promise = promisify(pbkdf2);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for auth checks
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Fetch user by email
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify password
    const [salt, storedHash] = user.password_hash.split(':');
    const newHash = await pbkdf2Promise(password, salt, 100000, 64, 'sha512');

    if (newHash.toString('hex') !== storedHash) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create JWT
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
        throw new Error('JWT_SECRET não está definida nas variáveis de ambiente.');
    }
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign", "verify"],
    );


    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    const token = await create({ alg: "HS512", typ: "JWT" }, payload, key);

    return new Response(JSON.stringify({
        message: 'Login bem-sucedido!',
        token,
        user: { id: user.id, email: user.email, role: user.role, company_id: user.company_id }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
