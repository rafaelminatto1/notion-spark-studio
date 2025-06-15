import { Task } from '@/types/task';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '@/hooks/useTasks';
import { TaskDialog } from './TaskDialog';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const statusColors = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800'
};

export function TaskCard({ task }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStatusChange = (newStatus: Task['status']) => {
    updateTask({ id: task.id, updates: { status: newStatus } });
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(task.id);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <Badge className={priorityColors[task.priority]}>
              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {task.description && (
            <p className="text-sm text-gray-600 mb-4">{task.description}</p>
          )}
          
          <div className="space-y-2">
            {task.dueDate && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {format(task.dueDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              Criada em {format(task.createdAt, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>

            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              Excluir
            </Button>
          </div>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="todo">A fazer</option>
            <option value="in_progress">Em progresso</option>
            <option value="done">Concluída</option>
          </select>
        </CardFooter>
      </Card>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={task}
      />
    </>
  );
} 