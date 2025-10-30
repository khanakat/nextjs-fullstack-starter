"use client";

import React from "react";
import { WorkflowList } from "@/components/workflows/workflow-list";
import { Workflow } from "@/lib/types/workflows";

export default function WorkflowsPage() {
  const handleCreateNew = () => {
    // Navigate to workflow creation page (placeholder)
    console.log("Create new workflow");
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    // Navigate to workflow edit page (placeholder)
    console.log("Edit workflow:", workflow.id);
  };

  const handleViewWorkflow = (workflow: Workflow) => {
    // Navigate to workflow view page (placeholder)
    console.log("View workflow:", workflow.id);
  };

  return (
    <div className="container mx-auto py-6">
      <WorkflowList
        onCreateNew={handleCreateNew}
        onEditWorkflow={handleEditWorkflow}
        onViewWorkflow={handleViewWorkflow}
      />
    </div>
  );
}