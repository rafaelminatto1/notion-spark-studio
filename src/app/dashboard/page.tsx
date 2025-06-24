import React from 'react';
import DashboardLayout from './DashboardLayout';
import DashboardTabs from './DashboardTabs';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6 text-center">Bem-vindo ao Notion Spark Studio!</h1>
      <DashboardTabs />
    </DashboardLayout>
  );
} 