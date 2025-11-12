// supabase/functions/signup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';
import { Buffer } from 'https://deno.land/std@0.168.0/node/buffer.ts';
import { pbkdf2 } from 'https://deno.land/std@0.168.0/node/crypto.ts';
import { promisify } from 'https://deno.land/std@0.168.0/node/util.ts';

const pbkdf2Promise = promisify(pbkdf2);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, password, company_name } = await req.json();

    if (!name || !email || !password || !company_name) {
      return new Response(JSON.stringify({ error: 'Nome, email, senha e nome da empresa são obrigatórios.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Use the SERVICE_ROLE_KEY to be able to create companies and users
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Usuário com este email já existe.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // Conflict
      });
    }

    // 1. Create a new company
    const { data: newCompany, error: companyError } = await supabaseClient
      .from('companies')
      .insert({ name: company_name })
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    // 2. Hash the password
    const salt = crypto.randomUUID();
    const hash = await pbkdf2Promise(password, salt, 100000, 64, 'sha512');
    const password_hash = `${salt}:${hash.toString('hex')}`;

    // 3. Create a new user and link to the company
    const { data: newUser, error: userError } = await supabaseClient
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        company_id: newCompany.id,
        role: 'admin', // First user is an admin
      })
      .select()
      .single();

    if (userError) {
      // If user creation fails, we should ideally roll back the company creation.
      // For simplicity here, we'll just log the error.
      // In a real-world scenario, use a database transaction.
      console.error('Failed to create user after creating company. Company ID:', newCompany.id);
      throw userError;
    }

    return new Response(JSON.stringify({
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, company_id: newUser.company_id }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
