import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { scanPolicyDocument } from "@/lib/jobs/scanner";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin"]);
  const { id } = await params;
  const result = await scanPolicyDocument(id);
  return NextResponse.json(result);
}
