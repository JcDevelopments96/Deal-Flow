#!/usr/bin/env node
/**
 * ingest-market-data.js — pulls Zillow ZHVI/ZORI + Redfin county tracker CSVs
 * and upserts them into Supabase `market_indexes`.
 *
 * Run locally once to seed:
 *   node scripts/ingest-market-data.js
 *
 * Or schedule as a monthly GitHub Actions job (see .github/workflows if one
 * exists). Each run overwrites the snapshot for every region — the table is
 * a *current state* snapshot, not a time series.
 *
 * Needs these env vars:
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Sources (all free, no API key):
 *   - Zillow ZHVI (home value) per county: County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv
 *   - Zillow ZORI (rent) per county:       County_zori_uc_sfrcondomfr_sm_month.csv
 *   - Redfin county market tracker:        county_market_tracker.tsv000.gz
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import { createClient } from "@supabase/supabase-js";

// Strip stray quotes/whitespace — a common mistake when pasting values into
// GitHub Secrets UI is to include the surrounding quotes from a .env line.
const clean = (v) => typeof v === "string" ? v.replace(/^['"]|['"]$/g, "").trim() : v;
const SUPABASE_URL = clean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const SERVICE_KEY  = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_URL).");
  process.exit(1);
}
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Service key: ${SERVICE_KEY.slice(0, 12)}...${SERVICE_KEY.slice(-4)} (len=${SERVICE_KEY.length})`);
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Sanity check: prove we can actually READ before we start downloading 700MB.
// If the key is wrong this errors out immediately and the job fails loudly.
{
  const { count, error } = await db
    .from("market_indexes")
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error("❌ Supabase connection test failed:", error.message);
    console.error("   Check that SUPABASE_SERVICE_ROLE_KEY matches the project at SUPABASE_URL.");
    process.exit(1);
  }
  console.log(`Supabase OK — market_indexes currently has ${count} rows.\n`);
}

const ZILLOW_ZHVI_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
const ZILLOW_ZORI_URL = "https://files.zillowstatic.com/research/public_csvs/zori/County_zori_uc_sfrcondomfr_sm_month.csv";
const REDFIN_COUNTY_URL = "https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/county_market_tracker.tsv000.gz";

const tmpDir = path.join(process.cwd(), ".cache");
fs.mkdirSync(tmpDir, { recursive: true });

// ── CSV parser (streams line-by-line; handles quoted fields with commas) ──
async function* readCsvLines(filePath, { sep = "," } = {}) {
  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunk;
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      yield buffer.slice(0, newlineIndex).replace(/\r$/, "");
      buffer = buffer.slice(newlineIndex + 1);
    }
  }
  if (buffer) yield buffer;
}
function parseCsvRow(line, sep = ",") {
  const out = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "\"") {
      if (inQuotes && line[i + 1] === "\"") { cur += "\""; i++; }
      else inQuotes = !inQuotes;
    } else if (c === sep && !inQuotes) {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

// ── Download helper with streaming gunzip for .gz urls ────────────────────
async function downloadTo(url, filePath, { gunzip = false } = {}) {
  console.log(`  ↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const write = fs.createWriteStream(filePath);
  if (gunzip) {
    const { Readable } = await import("node:stream");
    await pipeline(Readable.fromWeb(res.body), zlib.createGunzip(), write);
  } else {
    const { Readable } = await import("node:stream");
    await pipeline(Readable.fromWeb(res.body), write);
  }
  const { size } = fs.statSync(filePath);
  console.log(`    ✓ ${(size / 1024 / 1024).toFixed(1)} MB`);
}

// ── Zillow CSV shape: each row is a county; columns are wide — one per
//    month ("2020-01-31", "2020-02-29", ...). Plus metadata columns.
async function parseZillowCsv(filePath) {
  const iter = readCsvLines(filePath);
  const first = await iter.next();
  const headers = parseCsvRow(first.value);
  const idx = {
    regionId: headers.indexOf("RegionID"),
    regionName: headers.indexOf("RegionName"),
    state: headers.indexOf("State"),
    stateCodeFips: headers.indexOf("StateCodeFIPS"),
    munCodeFips: headers.indexOf("MunicipalCodeFIPS")
  };
  // Month columns — everything in YYYY-MM-DD format
  const monthCols = headers
    .map((h, i) => /^\d{4}-\d{2}-\d{2}$/.test(h) ? { col: i, date: h } : null)
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestCol = monthCols[monthCols.length - 1];
  const yoyCol = monthCols[monthCols.length - 13]; // 12 months earlier

  const rows = [];
  for await (const line of iter) {
    if (!line.trim()) continue;
    const cells = parseCsvRow(line);
    const latest = Number(cells[latestCol.col]);
    const yoy = yoyCol ? Number(cells[yoyCol.col]) : NaN;
    if (!Number.isFinite(latest)) continue;
    const stateFips = String(cells[idx.stateCodeFips] || "").padStart(2, "0");
    const countyFips = String(cells[idx.munCodeFips] || "").padStart(3, "0");
    rows.push({
      region_id: `${stateFips}${countyFips}`,
      region_name: cells[idx.regionName],
      state_code: cells[idx.state],
      latest,
      yoy_pct: Number.isFinite(yoy) && yoy > 0 ? +(((latest - yoy) / yoy) * 100).toFixed(1) : null,
      as_of: latestCol.date
    });
  }
  return rows;
}

// ── Redfin TSV shape: one row per (county, period). We want the most recent
//    row per county. Columns include region, median_sale_price, median_dom,
//    homes_sold, etc.
async function parseRedfinTsv(filePath) {
  const iter = readCsvLines(filePath, { sep: "\t" });
  const first = await iter.next();
  const headers = parseCsvRow(first.value, "\t");
  // Case-insensitive header lookup — Redfin uses UPPERCASE in this file.
  const headerIndex = (name) => headers.findIndex(h => h && h.toUpperCase() === name.toUpperCase());
  const idx = {
    period_end: headerIndex("PERIOD_END"),
    region: headerIndex("REGION"),
    stateCode: headerIndex("STATE_CODE"),
    region_type: headerIndex("REGION_TYPE"),
    median_sale_price: headerIndex("MEDIAN_SALE_PRICE"),
    median_dom: headerIndex("MEDIAN_DOM"),
    inventory: headerIndex("INVENTORY"),
    property_type: headerIndex("PROPERTY_TYPE")
  };
  for (const [k, v] of Object.entries(idx)) {
    if (v === -1) console.warn(`  (warn) Redfin column not found: ${k}`);
  }
  const byCounty = new Map(); // key: "stateCode:countyNameLower" -> row data
  let countyRowsSeen = 0;
  for await (const line of iter) {
    if (!line.trim()) continue;
    const cells = parseCsvRow(line, "\t");
    if (cells[idx.region_type] !== "county") continue;
    // Redfin publishes one row per (county, property_type). We only want the
    // "All Residential" rollup so we don't double-count condos/SFR/etc.
    if (idx.property_type !== -1 && cells[idx.property_type] !== "All Residential") continue;
    countyRowsSeen++;
    const regionRaw = cells[idx.region] || "";
    const period = cells[idx.period_end];
    if (!period) continue;
    const stateCode = cells[idx.stateCode];
    const countyName = regionRaw.split(",")[0]
      .replace(/\s+County$/i, "")
      .replace(/\s+Parish$/i, "")
      .trim()
      .toLowerCase();
    const key = `${stateCode}:${countyName}`;
    const existing = byCounty.get(key);
    if (!existing || existing.period < period) {
      byCounty.set(key, {
        period,
        stateCode,
        regionName: regionRaw,
        countyNameLower: countyName,
        median_sale_price: Number(cells[idx.median_sale_price]) || null,
        median_dom: Number(cells[idx.median_dom]) || null,
        inventory: Number(cells[idx.inventory]) || null
      });
    }
  }
  console.log(`    matched ${byCounty.size} counties from ${countyRowsSeen} rows`);
  return byCounty;
}

// ── Upsert in chunks (Supabase REST limit ~1000 rows per request) ─────────
async function upsertChunks(rows) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await db
      .from("market_indexes")
      .upsert(slice, { onConflict: "region_type,region_id" });
    if (error) {
      console.error(`Upsert failed at ${i}/${rows.length}:`, error.message);
      throw error;
    }
    process.stdout.write(`\r    upserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }
  process.stdout.write("\n");
}

async function main() {
  console.log("1. Zillow ZHVI (home values)");
  const zhviPath = path.join(tmpDir, "zillow_zhvi.csv");
  await downloadTo(ZILLOW_ZHVI_URL, zhviPath);
  const zhviRows = await parseZillowCsv(zhviPath);
  console.log(`    parsed ${zhviRows.length} counties`);

  console.log("2. Zillow ZORI (rents)");
  const zoriPath = path.join(tmpDir, "zillow_zori.csv");
  await downloadTo(ZILLOW_ZORI_URL, zoriPath);
  const zoriRows = await parseZillowCsv(zoriPath);
  const zoriByRegion = new Map(zoriRows.map(r => [r.region_id, r]));
  console.log(`    parsed ${zoriRows.length} counties`);

  console.log("3. Redfin county tracker");
  const redfinPath = path.join(tmpDir, "redfin_county.tsv");
  await downloadTo(REDFIN_COUNTY_URL, redfinPath, { gunzip: true });
  const redfinByKey = await parseRedfinTsv(redfinPath);
  console.log(`    parsed ${redfinByKey.size} counties`);

  console.log("4. Merging + upserting to Supabase");
  const merged = zhviRows.map(z => {
    const zori = zoriByRegion.get(z.region_id);
    // Match Redfin by state+county name (Redfin doesn't publish FIPS)
    const rfKey = `${z.state_code}:${(z.region_name || "").toLowerCase().replace(/\s+county$/i, "")}`;
    const rf = redfinByKey.get(rfKey);
    return {
      region_type: "county",
      region_id: z.region_id,
      region_name: z.region_name,
      state_code: z.state_code,
      zhvi_latest: z.latest,
      zhvi_yoy_pct: z.yoy_pct,
      zori_latest: zori ? zori.latest : null,
      zori_yoy_pct: zori ? zori.yoy_pct : null,
      redfin_median_price: rf ? rf.median_sale_price : null,
      redfin_median_dom: rf ? rf.median_dom : null,
      redfin_inventory: rf ? rf.inventory : null,
      as_of: z.as_of
    };
  });
  await upsertChunks(merged);

  // Verify the rows we just wrote are actually in the DB with fresh
  // updated_at. If this fails the upsert was going to a different project
  // or RLS silently blocked writes.
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: freshCount, error: verifyErr } = await db
    .from("market_indexes")
    .select("*", { count: "exact", head: true })
    .gt("updated_at", fiveMinAgo);
  if (verifyErr) {
    console.error("❌ Post-write verification query failed:", verifyErr.message);
    process.exit(1);
  }
  if (freshCount < merged.length) {
    console.error(`❌ Expected ${merged.length} fresh rows but only found ${freshCount}. Writes likely went elsewhere.`);
    process.exit(1);
  }
  console.log(`✅ Done — ${merged.length} counties refreshed, ${freshCount} verified fresh.`);
}

main().catch(err => { console.error(err); process.exit(1); });
