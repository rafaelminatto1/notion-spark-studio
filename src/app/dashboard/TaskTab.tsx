
import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '@/types/task';

export default function TaskTab() {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask } = useTasks();
  const [title, setTitle] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim()) {
      createTask.mutate(title, { onSuccess: () => setTitle('') });
    }
  }

  function handleToggle(taskId: string) {
    const task = tasks.find((t: Task) => t.id === taskId);
    if (task) {
      updateTask.mutate({
        id: taskId,
        updates: { 
          status: task.status === 'done' ? 'todo' : 'done',
          done: task.status !== 'done'
        }
      });
    }
  }

  function handleRemove(taskId: string) {
    deleteTask.mutate(taskId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarefas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <Input
            placeholder="Adicionar uma nova tarefa..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={createTask.isPending}
          />
          <Button type="submit" disabled={createTask.isPending || !title.trim()}>
            {createTask.isPending ? <Spinner /> : 'Adicionar'}
          </Button>
        </form>
        
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <div className="text-red-500 text-center">Erro ao carregar tarefas.</div>
        ) : (
          <motion.ul layout className="space-y-3">
            <AnimatePresence>
              {tasks.length === 0 && !createTask.isPending ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EmptyState message="Você está em dia! Nenhuma tarefa pendente." />
                 </motion.div>
              ) : (
                tasks.map((task: Task) => (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md transition-colors"
                  >
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.done || task.status === 'done'}
                      onCheckedChange={() => handleToggle(task.id)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`flex-1 text-sm ${(task.done || task.status === 'done') ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {task.title}
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemove(task.id)}
                      disabled={deleteTask.isPending}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </Button>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          </motion.ul>
        )}
      </CardContent>
    </Card>
  );
}
