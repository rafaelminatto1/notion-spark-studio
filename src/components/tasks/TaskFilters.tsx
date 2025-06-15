import { TaskFilters as TaskFiltersType, TaskPriority, TaskStatus } from '@/types/task';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFilterChange: (filters: Partial<TaskFiltersType>) => void;
}

export function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      <Select
        value={filters.status}
        onValueChange={(value: TaskStatus) => onFilterChange({ status: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo">A fazer</SelectItem>
          <SelectItem value="in_progress">Em progresso</SelectItem>
          <SelectItem value="done">Concluída</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value: TaskPriority) => onFilterChange({ priority: value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Baixa</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[180px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dueDate ? (
              format(filters.dueDate, 'PPP', { locale: ptBR })
            ) : (
              <span>Data de entrega</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={filters.dueDate}
            onSelect={(date) => onFilterChange({ dueDate: date })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        onClick={() => onFilterChange({})}
      >
        Limpar filtros
      </Button>
    </div>
  );
} 