import { createClient, type User } from '@supabase/supabase-js';
import type { SavedStatement, PersonalProfile } from '../types/tax';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://iiypmipvdxrtxpjyuafa.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JixBsL0q9vL1EdHURg570g_xYVq0wU-';

export const BACKEND_URL = import.meta.env.VITE_RENDER_URL || 'https://taxsnap-evh2.onrender.com';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-supabase-url.supabase.co'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_STORAGE_KEY = 'taxease_saved_computations_v1';

// ---------------------------------------------------------------------------
// Supabase Authentication Helpers
// ---------------------------------------------------------------------------

export async function signInWithGoogle(): Promise<{ error: any }> {
  if (!isSupabaseConfigured || !supabase) {
    return { error: { message: 'Supabase environment variables are missing.' } };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { error };
}

export async function signInWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Supabase is not configured yet.' } };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string): Promise<{ data: any; error: any }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: { message: 'Supabase is not configured yet.' } };
  }
  return await supabase.auth.signUp({ email, password });
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Local Storage Database Store & Unified Async Storage Service
// ---------------------------------------------------------------------------

export function getLocalSavedStatements(): SavedStatement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((s) => s && s.id && !s.id.startsWith('sample_stmt_'));
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function saveLocalStatement(statement: SavedStatement): void {
  const current = getLocalSavedStatements();
  const existingIndex = current.findIndex((s) => s.id === statement.id);
  if (existingIndex >= 0) {
    current[existingIndex] = statement;
  } else {
    current.unshift(statement);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
}

export function deleteLocalStatement(id: string): void {
  const current = getLocalSavedStatements();
  const filtered = current.filter((s) => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
}

export async function saveTaxStatement(statement: SavedStatement): Promise<{ success: boolean; error?: string }> {
  saveLocalStatement(statement);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('tax_computations').upsert({
        id: statement.id,
        created_at: statement.created_at,
        pan: statement.profile.pan,
        name: statement.profile.name,
        designation: statement.profile.designation,
        office_name: statement.profile.office_name,
        place: statement.profile.place,
        gross_income: statement.result.grossIncome,
        taxable_income: statement.result.taxableIncome,
        total_tax_liability: statement.result.totalTaxLiability,
        net_payable_or_refund: statement.result.netPayableOrRefund,
        full_data: statement,
      });

      if (error) {
        console.warn('Supabase save notice:', error.message);
        return { success: true, error: `Saved locally (Supabase: ${error.message})` };
      }
    } catch (err: any) {
      console.warn('Supabase save exception:', err);
    }
  }

  return { success: true };
}

export async function fetchTaxStatementById(id: string): Promise<SavedStatement | null> {
  const localList = getLocalSavedStatements();
  const localMatch = localList.find((s) => s.id === id);
  if (localMatch) return localMatch;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tax_computations')
        .select('full_data')
        .eq('id', id)
        .single();

      if (!error && data?.full_data) {
        return data.full_data as SavedStatement;
      }
    } catch (err) {
      console.error('Supabase fetch exception', err);
    }
  }

  return null;
}

export async function fetchAllTaxStatements(): Promise<SavedStatement[]> {
  let list: SavedStatement[] = getLocalSavedStatements().filter((s) => s && s.id && !s.id.startsWith('sample_stmt_'));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tax_computations')
        .select('full_data')
        .order('created_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        const remoteList = data
          .map((item: { full_data: SavedStatement }) => item.full_data)
          .filter((s) => s && s.id && !s.id.startsWith('sample_stmt_'));

        const combinedMap = new Map<string, SavedStatement>();
        list.forEach((s) => combinedMap.set(s.id, s));
        remoteList.forEach((s) => combinedMap.set(s.id, s));
        list = Array.from(combinedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch (err) {
      console.warn('Supabase table query notice (will use local list):', err);
    }
  }

  return list.filter((s) => s && s.id && !s.id.startsWith('sample_stmt_'));
}

export async function deleteTaxStatement(id: string): Promise<void> {
  deleteLocalStatement(id);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('tax_computations').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase delete exception', err);
    }
  }
}

// ---------------------------------------------------------------------------
// User Profile Backend Sync & Fetch Helpers
// ---------------------------------------------------------------------------

export async function fetchUserProfile(email: string): Promise<PersonalProfile | null> {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_profile')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!error && data?.full_profile) {
        try {
          localStorage.setItem(`taxsnap_personal_profile_${normalizedEmail}`, JSON.stringify(data.full_profile));
        } catch (e) {}
        return data.full_profile as PersonalProfile;
      }
    } catch (err) {
      console.warn('Supabase fetchUserProfile exception:', err);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(`taxsnap_personal_profile_${normalizedEmail}`);
    if (raw) {
      return JSON.parse(raw) as PersonalProfile;
    }
  } catch (e) {}

  return null;
}

export async function saveUserProfile(profile: PersonalProfile): Promise<{ success: boolean; error?: string }> {
  if (!profile.email) return { success: false, error: 'Email missing' };
  const normalizedEmail = profile.email.toLowerCase().trim();
  const profileToSave: PersonalProfile = { ...profile, email: normalizedEmail };

  // Always persist to local cache first
  try {
    localStorage.setItem(`taxsnap_personal_profile_${normalizedEmail}`, JSON.stringify(profileToSave));
  } catch (e) {}

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        email: normalizedEmail,
        name: profileToSave.name,
        dob: profileToSave.dob,
        phone: profileToSave.phone,
        school_office: profileToSave.schoolOffice,
        position: profileToSave.position,
        pan: profileToSave.pan,
        completed_onboarding: profileToSave.completedOnboarding,
        full_profile: profileToSave,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Supabase profile save notice:', error.message);
        return { success: true, error: `Saved locally (Supabase: ${error.message})` };
      }
    } catch (err: any) {
      console.warn('Supabase profile save exception:', err);
    }
  }

  return { success: true };
}

export async function fetchAllUserProfiles(): Promise<PersonalProfile[]> {
  const profileMap = new Map<string, PersonalProfile>();

  // Load from local storage cache
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('taxsnap_personal_profile_')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed && parsed.email) {
            profileMap.set(parsed.email.toLowerCase(), parsed);
          }
        }
      }
    }
  } catch (e) {}

  // Fetch from Supabase user_profiles table
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_profile')
        .order('updated_at', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        data.forEach((item: { full_profile: PersonalProfile }) => {
          if (item.full_profile?.email) {
            profileMap.set(item.full_profile.email.toLowerCase(), item.full_profile);
          }
        });
      }
    } catch (err) {
      console.warn('Supabase fetchAllUserProfiles notice:', err);
    }
  }

  return Array.from(profileMap.values());
}

export async function sendSupportTicket(ticket: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  // 1. Send real email to taxcalac@gmail.com using FormSubmit AJAX API
  try {
    await fetch('https://formsubmit.co/ajax/taxcalac@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: ticket.name,
        email: ticket.email,
        phone: ticket.phone || 'N/A',
        _subject: `[TaxSnap Support] ${ticket.subject}`,
        message: ticket.message,
        _replyto: ticket.email,
      }),
    });
  } catch (e) {
    console.warn('Email API notice:', e);
  }

  // 2. Also record support query in Supabase support_tickets table if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('support_tickets').insert({
        name: ticket.name,
        email: ticket.email,
        phone: ticket.phone || null,
        subject: ticket.subject,
        message: ticket.message,
        target_email: 'taxcalac@gmail.com',
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Supabase support ticket exception:', err);
    }
  }

  return { success: true };
}




