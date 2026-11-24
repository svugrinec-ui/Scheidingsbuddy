// Koppeling met Supabase voor inloggen met een code.
// Beide waarden zijn openbaar (ze staan sowieso in elke browser); de database
// wordt beschermd door Row Level Security. Zet hier NOOIT de service_role-key.
// Leeg = inloggen staat uit en de app werkt zoals voorheen.
window.SB_AUTH = {
  url: "https://xcljqutfxhhsluvbzqsa.supabase.co",// Supabase → Project Settings → API → Project URL, bv. "https://abcd1234.supabase.co"
  anonKey: "",    // Supabase → Project Settings → API Keys → publishable (of anon public) key
};
