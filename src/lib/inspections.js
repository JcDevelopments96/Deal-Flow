/* ============================================================================
   INSPECTION API HELPERS — wrappers around /api/inspection.

   Upload flow (so the client can upload PDFs larger than the 4.5MB Vercel
   serverless body limit):
     1. mintInspectionUploadUrl()   → { signedUploadUrl, inspectionId }
     2. PUT the file directly to signedUploadUrl (storage)
     3. summarizeInspection(id)     → blocks until Claude finishes
   ============================================================================ */
import { fetchMetered } from "./saas.js";

export async function mintInspectionUploadUrl(getToken, { filename, context, contextId, address, sizeBytes }) {
  return fetchMetered(getToken, "/api/inspection?action=upload-url", {
    method: "POST",
    body: JSON.stringify({ filename, context, contextId, address, sizeBytes })
  });
}

// Direct-to-storage upload using the signed URL we just got. Bypasses
// the Vercel function entirely so big PDFs go straight to Supabase.
export async function uploadInspectionFile(signedUrl, file) {
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return true;
}

// Triggers Claude processing. Returns the structured summary on success.
// Long-running — typical 10-25 seconds depending on PDF length.
export async function summarizeInspection(getToken, inspectionId) {
  return fetchMetered(getToken, "/api/inspection?action=summarize", {
    method: "POST",
    body: JSON.stringify({ inspectionId })
  });
}

export async function listInspections(getToken, { context, contextId }) {
  const qs = new URLSearchParams({ context, contextId: String(contextId) });
  const body = await fetchMetered(getToken, `/api/inspection?${qs.toString()}`);
  return body.inspections || [];
}

// All inspections for the signed-in user across every context (deal,
// watchlist, standalone). Used by the dedicated Inspections page so the
// user can see their full history at a glance.
export async function listAllInspections(getToken) {
  const body = await fetchMetered(getToken, "/api/inspection");
  return body.inspections || [];
}

export async function fetchInspection(getToken, id) {
  const qs = new URLSearchParams({ id: String(id) });
  const body = await fetchMetered(getToken, `/api/inspection?${qs.toString()}`);
  return body.inspection;
}

export async function deleteInspection(getToken, id) {
  const qs = new URLSearchParams({ id: String(id) });
  return fetchMetered(getToken, `/api/inspection?${qs.toString()}`, { method: "DELETE" });
}
