const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'paired' }
});

async function run() {
  const { data: inviterData } = await supabase.from('profiles').select('*').limit(1).single();
  if (!inviterData) { console.log('No profiles found'); return; }
  console.log('Inviter:', inviterData.id);
}

run().catch(console.error);