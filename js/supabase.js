/* ═══════════════════════════════════════════════
   HackVerse — Supabase Client
   ═══════════════════════════════════════════════ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxekyliygecrwdcogezl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Qa2XkgO8Ed3A3xEZc70Qlg_MdC3gMs7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
