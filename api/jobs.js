// Sayeh Connect : collecte les offres de design d'intérieur depuis 3 sources.
//  - Adzuna   (clé gratuite requise : ADZUNA_ID et ADZUNA_KEY)  -> pays européens
//  - Arbeitnow (sans clé)                                         -> Allemagne et Europe, souvent avec visa
//  - Remotive  (sans clé)                                         -> missions à distance et freelance
// Si une source échoue ou n'a pas de clé, les autres continuent.

// niveau 1 : design d'intérieur (score haut). niveau 2 : métiers proches (score plus bas).
const CORE_RE = /interior|innenarchitekt|innenraum|raumgestalt|intérieur|interieur|décorat|decorat|architecte d'int|space planner|set design|kitchen design|küchenplan|scénograph|scenograph/i;
const RELATED_RE = /architect|architekt|archviz|3d (artist|visuali|design|render)|visuali[sz]|render|cad\b|revit|archicad|sketchup|furniture|möbel|showroom|exhibition|messebau|retail design|store design|display design|stand design/i;
const TITLE_RE = { test: (t) => CORE_RE.test(t) || RELATED_RE.test(t) };
const SCAM_RE = /registration fee|processing fee|pay (a )?fee|western union|send money|crypto|frais d'inscription|frais de dossier/i;
const COUNTRIES = {
  fr: "France", de: "Allemagne", nl: "Pays-Bas", es: "Espagne", it: "Italie",
  pl: "Pologne", be: "Belgique", at: "Autriche", ch: "Suisse", gb: "Royaume-Uni"
};
const DAY = 86400000;

function strip(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ").trim();
}
function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}
function score(j) {
  let s = 58;
  if (CORE_RE.test(j.t)) s += 20;
  else s -= 8;
  const age = j.date ? (Date.now() - new Date(j.date).getTime()) / DAY : 30;
  if (age <= 3) s += 10; else if (age <= 7) s += 6; else if (age <= 14) s += 3;
  if (j.remote) s += 3;
  if (j.visa === "yes") s += 5;
  if (j.scam) s = Math.min(s, 40);
  return Math.max(10, Math.min(99, s));
}
function finish(j) {
  j.id = "x" + hash(j.url);
  j.scam = SCAM_RE.test(j.t + " " + (j.desc || ""));
  j.s = score(j);
  if (j.desc) j.desc = j.desc.length > 420 ? j.desc.slice(0, 417) + "…" : j.desc;
  j.lang = j.lang || "voir l'annonce";
  j.how = "Postulez depuis la page de l'offre (source : " + j.src + "). Joignez votre CV et votre lien portfolio.";
  return j;
}

async function getJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": "SayehConnect/1.0", Accept: "application/json" } });
  if (!r.ok) throw new Error(url + " -> " + r.status);
  return r.json();
}

async function adzuna() {
  const id = process.env.ADZUNA_ID, key = process.env.ADZUNA_KEY;
  if (!id || !key) return [];
  const out = [];
  await Promise.all(Object.keys(COUNTRIES).map(async (cc) => {
    try {
      const u = "https://api.adzuna.com/v1/api/jobs/" + cc + "/search/1?app_id=" + id + "&app_key=" + key +
        "&results_per_page=15&what=" + encodeURIComponent("interior designer") + "&sort_by=date&content-type=application/json";
      const d = await getJson(u);
      (d.results || []).forEach((r) => {
        if (!TITLE_RE.test(r.title || "")) return;
        out.push(finish({
          z: "ab", src: "Adzuna",
          ct: r.contract_time === "part_time" ? "part" : "full",
          t: strip(r.title), c: (r.company && r.company.display_name) || "Entreprise",
          k: COUNTRIES[cc], url: r.redirect_url, date: r.created,
          desc: strip(r.description), visa: "maybe", remote: /remote|télétravail|home ?office/i.test(r.title)
        }));
      });
    } catch (e) { /* source ignorée */ }
  }));
  return out;
}

const DBG = {};

async function arbeitnow() {
  const raw = [];
  try {
    for (const page of [1, 2, 3]) {
      const d = await getJson("https://www.arbeitnow.com/api/job-board-api?page=" + page);
      (d.data || []).forEach((r) => raw.push(r));
    }
  } catch (e) { DBG.arbeitnow = { error: String(e.message || e).slice(0, 120), raw: raw.length }; }
  if (!DBG.arbeitnow) DBG.arbeitnow = { raw: raw.length };
  return raw
    .filter((r) => TITLE_RE.test(r.title || "") || (r.tags || []).some((t) => TITLE_RE.test(t)))
    .map((r) => finish({
      z: "ab", src: "Arbeitnow",
      ct: /part/i.test((r.job_types || []).join(" ")) ? "part" : /contract|freelance/i.test((r.job_types || []).join(" ")) ? "free" : "full",
      t: strip(r.title), c: r.company_name || "Entreprise", k: r.location || "Allemagne",
      url: r.url, date: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
      desc: strip(r.description), remote: !!r.remote,
      visa: r.visa_sponsorship === true ? "yes" : "maybe", lang: "allemand / anglais"
    }));
}

async function remotive() {
  const raw = [];
  const urls = [
    "https://remotive.com/api/remote-jobs?category=design&limit=100",
    "https://remotive.com/api/remote-jobs?search=" + encodeURIComponent("interior") + "&limit=50"
  ];
  for (const u of urls) {
    try { const d = await getJson(u); (d.jobs || []).forEach((r) => raw.push(r)); }
    catch (e) { DBG.remotive = { error: String(e.message || e).slice(0, 120) }; }
  }
  DBG.remotive = Object.assign(DBG.remotive || {}, { raw: raw.length });
  return raw
    .filter((r) => TITLE_RE.test(r.title || ""))
    .map((r) => {
      const free = /contract|freelance/i.test(r.job_type || "");
      const loc = r.candidate_required_location || "Worldwide";
      return finish({
        z: "ab", src: "Remotive",
        ct: free ? "free" : /part/i.test(r.job_type || "") ? "part" : "full",
        t: strip(r.title), c: r.company_name || "Entreprise", k: "À distance",
        url: r.url, date: r.publication_date, desc: strip(r.description),
        remote: true, tnok: /worldwide|anywhere|africa|emea/i.test(loc), visa: "no",
        lang: "anglais · zone : " + loc
      });
    });
}

module.exports = async (req, res) => {
  const lists = await Promise.all([adzuna(), arbeitnow(), remotive()]);
  const seen = new Set();
  const jobs = [].concat(...lists)
    .filter((j) => j.url && !seen.has(j.url) && seen.add(j.url))
    .sort((a, b) => b.s - a.s)
    .slice(0, 80);
  res.setHeader("Cache-Control", "s-maxage=10800, stale-while-revalidate=43200");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify({
    updated: new Date().toISOString(),
    sources: { adzuna: lists[0].length, arbeitnow: lists[1].length, remotive: lists[2].length },
    debug: DBG,
    jobs
  }));
};
