import { NextResponse } from "next/server";
import { synchronizeAniListFranchiseRelations } from "@/lib/notifications/franchise-scheduler";
import { synchronizeUserNotifications } from "@/lib/notifications/scheduler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const franchiseSync = await synchronizeAniListFranchiseRelations();
    const notifications = await synchronizeUserNotifications();
    return NextResponse.json({ ok: true, franchiseSync, notifications });
  } catch (error) {
    console.error("Notification scheduler failed", error);
    return NextResponse.json({ ok: false, error: "SCHEDULER_FAILED" }, { status: 500 });
  }
}
