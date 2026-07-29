import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'paired' }
});

async function main() {
  const { data: members, error: memErr } = await supabase.from('workspace_members').select('*');
  console.log('Members:', members);

  const { data: invites, error: invErr } = await supabase.from('workspace_invitations').select('*');
  console.log('Invites:', invites);
}

main().catch(console.error);