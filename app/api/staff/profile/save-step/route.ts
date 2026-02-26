import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthFromRequest } from "@/app/lib/auth";
import {
  staffProfileBasicsSchema,
  staffComplianceSchema,
  staffHealthSafetySchema,
  staffSignatureSchema,
} from "@/app/lib/validations/staff";
import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

function formatZodError(err: z.ZodError): string {
  return Object.entries(err.flatten().fieldErrors)
    .map(([field, msgs]) => `${field.replace(/_/g, " ")}: ${(msgs as string[]).join(", ")}`)
    .join(" | ");
}

type StepResult = {
  validationError?: z.ZodError;
  dbError?: { message: string; code?: string; hint?: string; details?: string } | null;
};

// ---------------------------------------------------------------------------
// Per-step handlers
//
// Design: each handler validates only its own Zod schema then calls the
// matching SECURITY DEFINER RPC. We do NOT do a client-side profile-existence
// select — that select runs through RLS and can return nothing even when the
// row exists (JWT not resolving auth.uid() on a plain .from() query in some
// Supabase client configurations). The RPC itself enforces auth.uid() = p_id
// and raises "Profile not found" if Step 2 hasn't been completed, so that
// exception bubbles up as a clean DB error with the right message.
// ---------------------------------------------------------------------------

async function handleStep2(
  db: SupabaseClient,
  userId: string,
  userEmail: string,
  rawData: unknown
): Promise<StepResult> {
  const parsed = staffProfileBasicsSchema.safeParse(rawData);
  if (!parsed.success) return { validationError: parsed.error };

  const d = parsed.data;
  const { error } = await db.rpc("upsert_staff_profile", {
    p_id:                           userId,
    p_email:                        userEmail,
    p_full_name:                    d.full_name,
    p_national_insurance_number:    d.national_insurance_number ?? "",
    p_date_of_birth:                d.date_of_birth,
    p_phone:                        d.phone,
    p_address_line_1:               d.address_line_1,
    p_address_line_2:               d.address_line_2 ?? "",
    p_city:                         d.city,
    p_postcode:                     d.postcode,
    p_travel_radius_miles:          d.travel_radius_miles,
    p_transport_mode:               d.transport_mode,
    p_years_experience:             d.years_experience,
    p_qualification_level:          d.qualification_level,
    p_qualification_name:           d.qualification_name ?? "",
    p_criminal_conviction_declared: d.criminal_conviction_declared,
    p_criminal_conviction_details:  d.criminal_conviction_details ?? "",
  });
  return { dbError: error };
}

async function handleStep3(
  db: SupabaseClient,
  userId: string,
  rawData: unknown
): Promise<StepResult> {
  const parsed = staffComplianceSchema.safeParse(rawData);
  if (!parsed.success) return { validationError: parsed.error };

  const d = parsed.data;
  const { error } = await db.rpc("upsert_staff_compliance", {
    p_id:                         userId,
    p_dbs_update_service:         d.dbs_update_service,
    p_dbs_certificate_number:     d.dbs_certificate_number,
    p_dbs_issue_date:             d.dbs_issue_date,
    p_dbs_surname_on_certificate: d.dbs_surname_on_certificate,
  });
  return { dbError: error };
}

async function handleStep4(
  db: SupabaseClient,
  userId: string,
  rawData: unknown
): Promise<StepResult> {
  const parsed = staffHealthSafetySchema.safeParse(rawData);
  if (!parsed.success) return { validationError: parsed.error };

  const d = parsed.data;
  const { error } = await db.rpc("upsert_staff_health_safety", {
    p_id:                               userId,
    p_emergency_contact_1_name:         d.emergency_contact_1_name,
    p_emergency_contact_1_phone:        d.emergency_contact_1_phone,
    p_emergency_contact_1_relationship: d.emergency_contact_1_relationship,
    p_emergency_contact_2_name:         d.emergency_contact_2_name ?? "",
    p_emergency_contact_2_phone:        d.emergency_contact_2_phone ?? "",
    p_emergency_contact_2_relationship: d.emergency_contact_2_relationship ?? "",
    p_gp_name:                          d.gp_name,
    p_gp_address:                       d.gp_address,
    p_health_declaration:               d.health_declaration,
    p_smoking_declaration:              d.smoking_declaration,
    p_drugs_alcohol_declaration:        d.drugs_alcohol_declaration,
    p_disqualified_person_declaration:  d.disqualified_person_declaration,
  });
  return { dbError: error };
}

async function handleStep5(
  db: SupabaseClient,
  userId: string,
  rawData: unknown
): Promise<StepResult> {
  const parsed = staffSignatureSchema.safeParse(rawData);
  if (!parsed.success) return { validationError: parsed.error };

  const d = parsed.data;
  const { error } = await db.rpc("upsert_staff_signature", {
    p_id:                    userId,
    p_digital_signature_svg: d.digital_signature_svg,
  });
  return { dbError: error };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

const EnvelopeSchema = z.object({
  step: z.number().int().min(2).max(5),
  data: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  const auth = getAuthFromRequest(req);
  if (!auth.ok) {
    return jsonError(auth.status, auth.code, auth.message);
  }
  const { user, supabase } = auth;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "BAD_REQUEST", "Request body is missing or not valid JSON");
  }

  const envelope = EnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return jsonError(400, "BAD_REQUEST", "Invalid request — expected { step: number, data: object }");
  }

  const { step, data } = envelope.data;

  let result: StepResult;
  switch (step) {
    case 2: result = await handleStep2(supabase, user.id, user.email, data); break;
    case 3: result = await handleStep3(supabase, user.id, data); break;
    case 4: result = await handleStep4(supabase, user.id, data); break;
    case 5: result = await handleStep5(supabase, user.id, data); break;
    default:
      return jsonError(400, "BAD_REQUEST", `Unsupported step: ${step}`);
  }

  // When step 5 completes without error, record T&C acceptance.
  // The client enforces the checkbox; we record the server-side timestamp.
  if (step === 5 && !result.validationError && !result.dbError) {
    await supabase
      .from("staff_profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  if (result.validationError) {
    const flat = result.validationError.flatten();
    console.error("[save-step] validation failed", { requestId, step, userId: user.id, fields: flat.fieldErrors });
    return jsonError(400, "VALIDATION_ERROR", `Validation failed — ${formatZodError(result.validationError)}`, flat);
  }

  if (result.dbError) {
    console.error("[save-step] db error", {
      requestId, step, userId: user.id,
      code: result.dbError.code, message: result.dbError.message,
      hint: result.dbError.hint, details: result.dbError.details,
    });
    return jsonError(500, "DB_ERROR", result.dbError.message, {
      code: result.dbError.code,
      hint: result.dbError.hint ?? null,
    });
  }

  console.log("[save-step] ok", { requestId, step, userId: user.id });
  return NextResponse.json({ ok: true });
}
