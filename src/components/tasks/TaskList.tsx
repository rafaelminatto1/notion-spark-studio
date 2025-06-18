import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskDialog } from './TaskDialog';
import { useState } from 'react';

export function TaskList() {
  const { tasks, isLoading, filters, updateFilters } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas Tarefas</h2>
        <Button onClick={() => { setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <TaskFilters filters={filters} onFilterChange={updateFilters} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
} 