import { WorkflowDefinition } from "@/lib/types/workflows";

/**
 * Predefined workflow templates for common business processes
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  tags: string[];
  estimatedDuration?: string;
  complexity: "simple" | "medium" | "complex";
}

/**
 * Document Approval Workflow Template
 * Standard document review and approval process
 */
const documentApprovalTemplate: WorkflowTemplate = {
  id: "document-approval",
  name: "Document Approval",
  description:
    "Standard document review and approval process with multiple stakeholders",
  category: "Approval",
  tags: ["approval", "document", "review"],
  estimatedDuration: "3-5 days",
  complexity: "medium",
  definition: {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: {
          label: "Document Submitted",
          description: "Document submission triggers the approval workflow",
          config: {},
        },
      },
      {
        id: "task-1",
        type: "task",
        position: { x: 300, y: 100 },
        data: {
          label: "Initial Review",
          description:
            "Review document for completeness and basic requirements",
          slaHours: 24,
          config: {
            assigneeId: "${variables.reviewer}",
            dueDate: "${functions.addHours(24)}",
          },
        },
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 500, y: 100 },
        data: {
          label: "Review Decision",
          description: "Check if document passes initial review",
          config: {},
          conditions: {
            expression: '${data.reviewStatus} === "approved"',
          },
        },
      },
      {
        id: "task-2",
        type: "task",
        position: { x: 300, y: 300 },
        data: {
          label: "Request Revisions",
          description: "Send document back for revisions",
          config: {
            assigneeId: "${data.submitterId}",
          },
        },
      },
      {
        id: "approval-1",
        type: "approval",
        position: { x: 700, y: 100 },
        data: {
          label: "Manager Approval",
          description: "Final approval from department manager",
          slaHours: 48,
          config: {
            assigneeId: "${variables.manager}",
            dueDate: "${functions.addHours(48)}",
          },
        },
      },
      {
        id: "notification-1",
        type: "notification",
        position: { x: 900, y: 100 },
        data: {
          label: "Approval Notification",
          description: "Notify submitter of approval",
          config: {
            recipients: "${data.submitterEmail}",
            subject: "Document Approved: ${data.documentTitle}",
            message: "Your document has been approved and is now active.",
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 1100, y: 100 },
        data: {
          label: "Process Complete",
          description: "Document approval process completed",
          config: {},
        },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "task-1" },
      { id: "e2", source: "task-1", target: "condition-1" },
      {
        id: "e3",
        source: "condition-1",
        target: "approval-1",
        data: { label: "Approved" },
      },
      {
        id: "e4",
        source: "condition-1",
        target: "task-2",
        data: { label: "Needs Revision" },
      },
      { id: "e5", source: "task-2", target: "task-1" },
      { id: "e6", source: "approval-1", target: "notification-1" },
      { id: "e7", source: "notification-1", target: "end-1" },
    ],
  },
};

const expenseApprovalTemplate: WorkflowTemplate = {
  id: "expense-approval",
  name: "Expense Approval",
  description: "Multi-tier expense approval based on amount thresholds",
  category: "Approval",
  tags: ["expense", "approval", "finance"],
  estimatedDuration: "1-3 days",
  complexity: "medium",
  definition: {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: {
          label: "Expense Submitted",
          description: "Employee submits expense report",
          config: {},
        },
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 300, y: 100 },
        data: {
          label: "Amount Check",
          description: "Check expense amount for approval tier",
          config: {},
          conditions: {
            expression: "${data.amount} > 1000",
          },
        },
      },
      {
        id: "approval-1",
        type: "approval",
        position: { x: 500, y: 50 },
        data: {
          label: "Manager Approval",
          description: "Direct manager approval for amounts under $1000",
          slaHours: 24,
          config: {
            assigneeId: "${variables.directManager}",
          },
        },
      },
      {
        id: "approval-2",
        type: "approval",
        position: { x: 500, y: 150 },
        data: {
          label: "Finance Approval",
          description: "Finance team approval for amounts over $1000",
          slaHours: 48,
          config: {
            assigneeId: "${variables.financeManager}",
          },
        },
      },
      {
        id: "webhook-1",
        type: "webhook",
        position: { x: 700, y: 100 },
        data: {
          label: "Update Finance System",
          description: "Update expense in finance system",
          config: {
            url: "${variables.financeSystemUrl}/expenses",
            method: "POST",
            headers: {
              Authorization: "Bearer ${variables.financeApiKey}",
              "Content-Type": "application/json",
            },
          },
        },
      },
      {
        id: "notification-1",
        type: "notification",
        position: { x: 900, y: 100 },
        data: {
          label: "Approval Notification",
          description: "Notify employee of approval",
          config: {
            recipients: "${data.employeeEmail}",
            subject: "Expense Approved: ${data.expenseId}",
            message:
              "Your expense report has been approved and will be processed for payment.",
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 1100, y: 100 },
        data: {
          label: "Process Complete",
          description: "Expense approval completed",
          config: {},
        },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "condition-1" },
      {
        id: "e2",
        source: "condition-1",
        target: "approval-1",
        data: { label: "≤ $1000" },
      },
      {
        id: "e3",
        source: "condition-1",
        target: "approval-2",
        data: { label: "> $1000" },
      },
      { id: "e4", source: "approval-1", target: "webhook-1" },
      { id: "e5", source: "approval-2", target: "webhook-1" },
      { id: "e6", source: "webhook-1", target: "notification-1" },
      { id: "e7", source: "notification-1", target: "end-1" },
    ],
  },
};

/**
 * Employee Onboarding Workflow Template
 * Complete new employee onboarding process
 */
const employeeOnboardingTemplate: WorkflowTemplate = {
  id: "employee-onboarding",
  name: "Employee Onboarding",
  description:
    "Complete new employee onboarding process with all necessary steps",
  category: "Onboarding",
  tags: ["onboarding", "hr", "employee"],
  estimatedDuration: "1-2 weeks",
  complexity: "complex",
  definition: {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 200 },
        data: {
          label: "New Hire Started",
          description: "New employee onboarding process begins",
          config: {},
        },
      },
      {
        id: "task-1",
        type: "task",
        position: { x: 300, y: 100 },
        data: {
          label: "Setup IT Equipment",
          description: "Prepare laptop, accounts, and access credentials",
          slaHours: 24,
          config: {
            assigneeId: "${variables.itTeam}",
          },
        },
      },
      {
        id: "task-2",
        type: "task",
        position: { x: 300, y: 200 },
        data: {
          label: "Prepare Workspace",
          description: "Setup desk, office supplies, and workspace",
          slaHours: 24,
          config: {
            assigneeId: "${variables.facilities}",
          },
        },
      },
      {
        id: "task-3",
        type: "task",
        position: { x: 300, y: 300 },
        data: {
          label: "HR Documentation",
          description: "Complete employment paperwork and benefits enrollment",
          slaHours: 48,
          config: {
            assigneeId: "${variables.hrTeam}",
          },
        },
      },
      {
        id: "task-4",
        type: "task",
        position: { x: 500, y: 200 },
        data: {
          label: "Manager Introduction",
          description: "Schedule meeting with direct manager and team",
          slaHours: 24,
          config: {
            assigneeId: "${variables.directManager}",
          },
        },
      },
      {
        id: "task-5",
        type: "task",
        position: { x: 700, y: 200 },
        data: {
          label: "Training Schedule",
          description: "Enroll in required training programs",
          slaHours: 72,
          config: {
            assigneeId: "${variables.trainingCoordinator}",
          },
        },
      },
      {
        id: "notification-1",
        type: "notification",
        position: { x: 900, y: 200 },
        data: {
          label: "Welcome Email",
          description: "Send welcome email with first-day information",
          config: {
            recipients: "${data.employeeEmail}",
            subject: "Welcome to the Team!",
            message:
              "Welcome! Your onboarding is complete. Here's what to expect on your first day.",
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 1100, y: 200 },
        data: {
          label: "Onboarding Complete",
          description: "Employee onboarding process completed",
          config: {},
        },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "task-1" },
      { id: "e2", source: "start-1", target: "task-2" },
      { id: "e3", source: "start-1", target: "task-3" },
      { id: "e4", source: "task-1", target: "task-4" },
      { id: "e5", source: "task-2", target: "task-4" },
      { id: "e6", source: "task-3", target: "task-4" },
      { id: "e7", source: "task-4", target: "task-5" },
      { id: "e8", source: "task-5", target: "notification-1" },
      { id: "e9", source: "notification-1", target: "end-1" },
    ],
  },
};

/**
 * Customer Support Workflow Template
 * Handle customer support requests with escalation
 */
const customerSupportTemplate: WorkflowTemplate = {
  id: "customer-support",
  name: "Customer Support Ticket",
  description:
    "Handle customer support requests with escalation and resolution tracking",
  category: "Customer Service",
  tags: ["support", "customer", "ticket"],
  estimatedDuration: "1-5 days",
  complexity: "medium",
  definition: {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 200 },
        data: {
          label: "Ticket Created",
          description: "Customer support ticket submitted",
          config: {},
        },
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 300, y: 200 },
        data: {
          label: "Priority Check",
          description: "Determine ticket priority level",
          config: {},
          conditions: {
            expression: '${data.priority} === "high"',
          },
        },
      },
      {
        id: "task-1",
        type: "task",
        position: { x: 500, y: 100 },
        data: {
          label: "Urgent Response",
          description: "Immediate response for high priority tickets",
          slaHours: 2,
          config: {
            assigneeId: "${variables.seniorSupport}",
          },
        },
      },
      {
        id: "task-2",
        type: "task",
        position: { x: 500, y: 300 },
        data: {
          label: "Standard Response",
          description: "Standard response for normal priority tickets",
          slaHours: 24,
          config: {
            assigneeId: "${variables.supportTeam}",
          },
        },
      },
      {
        id: "condition-2",
        type: "condition",
        position: { x: 700, y: 200 },
        data: {
          label: "Resolution Check",
          description: "Check if issue is resolved",
          config: {},
          conditions: {
            expression: "${data.resolved} === true",
          },
        },
      },
      {
        id: "task-3",
        type: "task",
        position: { x: 900, y: 300 },
        data: {
          label: "Escalate to Manager",
          description: "Escalate unresolved issues to support manager",
          slaHours: 4,
          config: {
            assigneeId: "${variables.supportManager}",
          },
        },
      },
      {
        id: "notification-1",
        type: "notification",
        position: { x: 900, y: 100 },
        data: {
          label: "Resolution Notification",
          description: "Notify customer of resolution",
          config: {
            recipients: "${data.customerEmail}",
            subject: "Support Ticket Resolved: ${data.ticketId}",
            message:
              "Your support ticket has been resolved. Please let us know if you need further assistance.",
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 1100, y: 200 },
        data: {
          label: "Ticket Closed",
          description: "Support ticket resolved and closed",
          config: {},
        },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "condition-1" },
      {
        id: "e2",
        source: "condition-1",
        target: "task-1",
        data: { label: "High Priority" },
      },
      {
        id: "e3",
        source: "condition-1",
        target: "task-2",
        data: { label: "Normal Priority" },
      },
      { id: "e4", source: "task-1", target: "condition-2" },
      { id: "e5", source: "task-2", target: "condition-2" },
      {
        id: "e6",
        source: "condition-2",
        target: "notification-1",
        data: { label: "Resolved" },
      },
      {
        id: "e7",
        source: "condition-2",
        target: "task-3",
        data: { label: "Not Resolved" },
      },
      { id: "e8", source: "task-3", target: "condition-2" },
      { id: "e9", source: "notification-1", target: "end-1" },
    ],
  },
};

/**
 * Procurement Request Workflow Template
 * Purchase request approval and procurement process
 */
const procurementRequestTemplate: WorkflowTemplate = {
  id: "procurement-request",
  name: "Procurement Request",
  description: "Purchase request approval and procurement process",
  category: "Procurement",
  tags: ["procurement", "purchase", "approval"],
  estimatedDuration: "1-2 weeks",
  complexity: "complex",
  definition: {
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 200 },
        data: {
          label: "Purchase Request",
          description: "Employee submits purchase request",
          config: {},
        },
      },
      {
        id: "task-1",
        type: "task",
        position: { x: 300, y: 200 },
        data: {
          label: "Budget Verification",
          description: "Verify budget availability for purchase",
          slaHours: 24,
          config: {
            assigneeId: "${variables.financeTeam}",
          },
        },
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 500, y: 200 },
        data: {
          label: "Amount Threshold",
          description: "Check if amount requires additional approval",
          config: {},
          conditions: {
            expression: "${data.amount} > 5000",
          },
        },
      },
      {
        id: "approval-1",
        type: "approval",
        position: { x: 700, y: 100 },
        data: {
          label: "Director Approval",
          description: "Director approval for high-value purchases",
          slaHours: 48,
          config: {
            assigneeId: "${variables.director}",
          },
        },
      },
      {
        id: "task-2",
        type: "task",
        position: { x: 700, y: 300 },
        data: {
          label: "Vendor Selection",
          description: "Select vendor and obtain quotes",
          slaHours: 72,
          config: {
            assigneeId: "${variables.procurementTeam}",
          },
        },
      },
      {
        id: "task-3",
        type: "task",
        position: { x: 900, y: 200 },
        data: {
          label: "Create Purchase Order",
          description: "Generate and send purchase order to vendor",
          slaHours: 24,
          config: {
            assigneeId: "${variables.procurementTeam}",
          },
        },
      },
      {
        id: "webhook-1",
        type: "webhook",
        position: { x: 1100, y: 200 },
        data: {
          label: "Update ERP System",
          description: "Update purchase order in ERP system",
          config: {
            url: "${variables.erpSystemUrl}/purchase-orders",
            method: "POST",
            headers: {
              Authorization: "Bearer ${variables.erpApiKey}",
            },
          },
        },
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 1300, y: 200 },
        data: {
          label: "Order Placed",
          description: "Purchase order placed with vendor",
          config: {},
        },
      },
    ],
    edges: [
      { id: "e1", source: "start-1", target: "task-1" },
      { id: "e2", source: "task-1", target: "condition-1" },
      {
        id: "e3",
        source: "condition-1",
        target: "approval-1",
        data: { label: "> $5000" },
      },
      {
        id: "e4",
        source: "condition-1",
        target: "task-2",
        data: { label: "≤ $5000" },
      },
      { id: "e5", source: "approval-1", target: "task-2" },
      { id: "e6", source: "task-2", target: "task-3" },
      { id: "e7", source: "task-3", target: "webhook-1" },
      { id: "e8", source: "webhook-1", target: "end-1" },
    ],
  },
};

/**
 * Export all workflow templates
 */
export const workflowTemplates: WorkflowTemplate[] = [
  documentApprovalTemplate,
  expenseApprovalTemplate,
  employeeOnboardingTemplate,
  customerSupportTemplate,
  procurementRequestTemplate,
];

export const getTemplatesByCategory = (
  category?: string,
): WorkflowTemplate[] => {
  return category
    ? workflowTemplates.filter((t) => t.category === category)
    : workflowTemplates;
};

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find((t) => t.id === id);
};

export const getTemplateCategories = (): string[] => {
  return [...new Set(workflowTemplates.map((t) => t.category))];
};

export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return workflowTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  );
};
