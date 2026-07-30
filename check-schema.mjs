import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbngljpbacovdrnhddpm.supabase.co';
const supabaseKey = 'sb_publishable_tMLaqXoL18WU4sRQL_gixw_9JiMbSny';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, bio, interests, terms_accepted_at')
      .limit(1);
    
    if (error) {
      console.error('Error checking schema:', error);
      return;
    }
    
    console.log('Schema check successful!');
    console.log('Columns bio, interests, and terms_accepted_at are accessible.');
    console.log('Sample data:', data);
  } catch (err) {
    console.error('Failed to check schema:', err);
  }
}

checkSchema();
