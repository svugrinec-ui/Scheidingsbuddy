// Geeft de ingelogde gebruiker de sleutel waarmee de app zijn gegevens versleutelt.
// De sleutel wordt afgeleid van SYNC_SECRET (alleen in Vercel) en het gebruikers-id,
// dus de database alleen is niet genoeg om iets te lezen.
// LET OP: SYNC_SECRET nooit wijzigen, anders zijn opgeslagen gegevens niet meer te openen.
const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://xcljqutfxhhsluvbzqsa.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_ZV7CMiBW45NQJj09v9liIg_AZcaDoHf";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const geheim = process.env.SYNC_SECRET || "";
  if (geheim.length < 32) return res.status(503).json({ fout: "SYNC_SECRET ontbreekt" });
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ fout: "niet ingelogd" });
  // Laat Supabase het token controleren; dat geeft ons het echte gebruikers-id.
  let user = null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: auth } });
    if (r.ok) user = await r.json();
  } catch {}
  if (!user || !user.id) return res.status(401).json({ fout: "niet ingelogd" });
  const sleutel = crypto.createHmac("sha256", geheim).update(`scheidingsbuddy-sync|${user.id}`).digest("base64");
  return res.status(200).json({ sleutel });
};
