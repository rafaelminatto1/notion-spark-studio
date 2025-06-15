import { TaskList } from '@/components/tasks/TaskList';
import { AuthGuard } from '@/components/AuthGuard';

export default function TasksPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Tarefas</h1>
        <TaskList />
      </div>
    </AuthGuard>
  );
} 