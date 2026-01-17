"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your projects and workflows
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Projects
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>

          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">
              AI Generations
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>

          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">
              Workflows Created
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/workflow">
                <Button className="w-full justify-start" variant="outline">
                  Create New Workflow
                </Button>
              </Link>
              <Button className="w-full justify-start" variant="outline">
                Generate Code with AI
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Voice to Architecture
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="text-sm text-muted-foreground">
              No recent activity yet. Start creating workflows to see your
              activity here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
