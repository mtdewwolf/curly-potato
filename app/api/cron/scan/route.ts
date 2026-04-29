import { NextResponse } from "next/server";
import { scanDuePolicies } from "@/lib/jobs/scanner";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await scanDuePolicies();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return POST(request);
}
