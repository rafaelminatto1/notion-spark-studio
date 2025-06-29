
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import TaskTab from './TaskTab';
import NotesTab from './NotesTab';
import MetricsTab from './MetricsTab';
import PerformanceTab from './PerformanceTab';

const tabConfig = [
  { value: "tasks", label: "Tarefas", component: <TaskTab /> },
  { value: "notes", label: "Notas", component: <NotesTab /> },
  { value: "metrics", label: "Métricas", component: <MetricsTab /> },
  { value: "performance", label: "Performance", component: <PerformanceTab /> },
];

export default function DashboardTabs() {
  return (
    <Tabs defaultValue="tasks" className="w-full">
      <TabsList>
        {tabConfig.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabConfig.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
