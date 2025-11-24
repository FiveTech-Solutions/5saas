// supabase/functions/signup/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';

// Function to handle the signup process
async function handleSignup(supabaseAdmin: SupabaseClient, companyName: string, userName: string, email: string, password: string) {
  // 1. Create a new tenant (company)
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({ name: companyName })
    .select()
    .single();

  if (tenantError) {
    console.error('Error creating tenant:', tenantError);
    throw new Error(`Failed to create company: ${tenantError.message}`);
  }

  // 2. Create the user in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm user for simplicity. Consider sending a confirmation email in production.
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    // Attempt to roll back tenant creation for cleanliness
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
    throw new Error(`Failed to create user: ${authError.message}`);
  }
  
  const userId = authUser.user.id;

  // 3. Create the user profile in public.users, linking to the tenant
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: userId,
      tenant_id: tenant.id,
      full_name: userName,
      role: 'admin', // The first user of a tenant is always an admin
    });

  if (profileError) {
    console.error('Error creating user profile:', profileError);
    // Attempt to roll back auth user and tenant
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  // 4. Fetch the 'basic' plan to create the initial subscription
  const { data: basicPlan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('name', 'basic')
    .single();

  if (planError || !basicPlan) {
    console.error('Error fetching basic plan:', planError);
    // Roll back
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
    throw new Error('Basic plan not found. System is not configured correctly.');
  }

  // 5. Create the initial subscription for the tenant (e.g., 15-day trial)
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 15);

  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .insert({
      tenant_id: tenant.id,
      plan_id: basicPlan.id,
      status: 'trialing',
      billing_cycle: 'monthly', // Default billing cycle
      trial_ends_at: trialEnds.toISOString(),
    });

  if (subscriptionError) {
    console.error('Error creating subscription:', subscriptionError);
    // Roll back
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
    // The user profile will be deleted by cascade from the auth user deletion.
    throw new Error(`Failed to create initial subscription: ${subscriptionError.message}`);
  }

  return {
    message: 'User and company signed up successfully.',
    userId: userId,
    tenantId: tenant.id,
  };
}

// Main server logic
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, password, company_name } = await req.json();

    if (!name || !email || !password || !company_name) {
      return new Response(JSON.stringify({ error: 'Name, email, password, and company name are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the service role key to perform admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const result = await handleSignup(supabaseAdmin, company_name, name, email, password);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Unhandled error in signup function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});