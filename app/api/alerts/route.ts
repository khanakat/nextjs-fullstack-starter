import { NextRequest, NextResponse } from "next/server";
import {
  getAlertManager,
  AlertRule,
  AlertChannel,
} from "@/lib/monitoring/alerts";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "alerts";

    const alertManager = getAlertManager();

    switch (type) {
      case "alerts":
        const activeAlerts = alertManager.getActiveAlerts();
        return NextResponse.json({
          active: activeAlerts,
          total: alertManager.getAllAlerts().length,
        });

      case "rules":
        const rules = alertManager.getRules();
        return NextResponse.json({ rules });

      case "channels":
        const channels = alertManager.getChannels();
        return NextResponse.json({ channels });

      case "history":
        const allAlerts = alertManager.getAllAlerts();
        return NextResponse.json({ alerts: allAlerts });

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    const alertManager = getAlertManager();

    switch (action) {
      case "create_rule":
        const rule: AlertRule = data;
        alertManager.addRule(rule);
        return NextResponse.json({
          success: true,
          message: "Alert rule created",
        });

      case "update_rule":
        const { ruleId, updates } = data;
        const updated = alertManager.updateRule(ruleId, updates);
        if (!updated) {
          return NextResponse.json(
            { error: "Rule not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Alert rule updated",
        });

      case "delete_rule":
        const { ruleId: deleteRuleId } = data;
        const deleted = alertManager.removeRule(deleteRuleId);
        if (!deleted) {
          return NextResponse.json(
            { error: "Rule not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Alert rule deleted",
        });

      case "create_channel":
        const channel: AlertChannel = data;
        alertManager.addChannel(channel);
        return NextResponse.json({
          success: true,
          message: "Alert channel created",
        });

      case "update_channel":
        const { channelId, updates: channelUpdates } = data;
        const channelUpdated = alertManager.updateChannel(
          channelId,
          channelUpdates,
        );
        if (!channelUpdated) {
          return NextResponse.json(
            { error: "Channel not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Alert channel updated",
        });

      case "delete_channel":
        const { channelId: deleteChannelId } = data;
        const channelDeleted = alertManager.removeChannel(deleteChannelId);
        if (!channelDeleted) {
          return NextResponse.json(
            { error: "Channel not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({
          success: true,
          message: "Alert channel deleted",
        });

      case "resolve_alert":
        const { alertId } = data;
        const resolved = alertManager.resolveAlert(alertId);
        if (!resolved) {
          return NextResponse.json(
            { error: "Alert not found or already resolved" },
            { status: 404 },
          );
        }
        return NextResponse.json({ success: true, message: "Alert resolved" });

      case "test_alert":
        const { ruleId: testRuleId } = data;
        const tested = await alertManager.testAlert(testRuleId);
        if (!tested) {
          return NextResponse.json(
            { error: "Rule not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ success: true, message: "Test alert sent" });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing alerts request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
