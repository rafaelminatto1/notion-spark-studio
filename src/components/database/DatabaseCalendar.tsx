
import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { Database, DatabaseView, DatabaseRow} from '@/types/database';
import { DatabaseProperty } from '@/types/database';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DatabaseCalendarProps {
  database: Database;
  view: DatabaseView;
  onUpdateDatabase: (updates: Partial<Database>) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  row: DatabaseRow;
  color: string;
}

export const DatabaseCalendar: React.FC<DatabaseCalendarProps> = ({
  database,
  view,
  onUpdateDatabase
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Find date properties in the database
  const dateProperties = useMemo(() => {
    return database.properties.filter(prop => prop.type === 'date');
  }, [database.properties]);

  // Get the primary date property (first date property or user-selected)
  const primaryDateProperty = dateProperties[0];

  // Convert database rows to calendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!primaryDateProperty) return [];

    return database.rows
      .map(row => {
        const dateValue = row.properties[primaryDateProperty.id];
        if (!dateValue) return null;

        let eventDate: Date;
        try {
          if (typeof dateValue === 'string') {
            eventDate = parseISO(dateValue);
          } else if (dateValue instanceof Date) {
            eventDate = dateValue;
          } else {
            return null;
          }

          if (!isValid(eventDate)) return null;
        } catch {
          return null;
        }

        // Get title from first text property or use row ID
        const titleProperty = database.properties.find(prop => prop.type === 'text');
        const title = titleProperty 
          ? row.properties[titleProperty.id] || 'Sem título'
          : `Item ${row.id.slice(0, 8)}`;

        // Get color from select property if available
        const selectProperty = database.properties.find(prop => prop.type === 'select');
        let color = 'bg-blue-500';
        
        if (selectProperty && row.properties[selectProperty.id]) {
          const selectedOption = selectProperty.options?.selectOptions?.find(
            opt => opt.id === row.properties[selectProperty.id]
          );
          if (selectedOption) {
            color = `bg-${selectedOption.color}-500`;
          }
        }

        return {
          id: row.id,
          title: String(title),
          date: eventDate,
          row,
          color
        };
      })
      .filter((event): event is CalendarEvent => event !== null);
  }, [database.rows, database.properties, primaryDateProperty]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return calendarEvents.filter(event => isSameDay(event.date, date));
  };

  // Get events for the current month
  const monthEvents = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return calendarEvents.filter(event => 
      event.date >= monthStart && event.date <= monthEnd
    );
  }, [calendarEvents, currentDate]);

  // Create new row for selected date
  const createEventForDate = (date: Date) => {
    if (!primaryDateProperty) return;

    const newRow: DatabaseRow = {
      id: crypto.randomUUID(),
      properties: {
        [primaryDateProperty.id]: format(date, 'yyyy-MM-dd')
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add default title if text property exists
    const titleProperty = database.properties.find(prop => prop.type === 'text');
    if (titleProperty) {
      newRow.properties[titleProperty.id] = `Novo evento - ${format(date, 'dd/MM/yyyy')}`;
    }

    const updatedRows = [...database.rows, newRow];
    onUpdateDatabase({ rows: updatedRows });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (!primaryDateProperty) {
    return (
      <div className="p-8 text-center text-gray-400">
        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Nenhum campo de data encontrado</h3>
        <p className="text-sm">
          Para usar a visualização de calendário, adicione pelo menos um campo de data ao seu database.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-sm text-gray-400">
            {monthEvents.length} evento(s) este mês
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="px-3"
          >
            Hoje
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card className="bg-notion-dark border-notion-dark-border">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                locale={ptBR}
                className="w-full"
                modifiers={{
                  hasEvents: (date) => getEventsForDate(date).length > 0
                }}
                modifiersClassNames={{
                  hasEvents: "bg-blue-500/20 text-blue-300 font-medium"
                }}
                components={{
                  Day: ({ date, ...props }) => {
                    const events = getEventsForDate(date);
                    const hasEvents = events.length > 0;
                    
                    return (
                      <div className="relative w-full h-full">
                        <button
                          {...props}
                          className={cn(
                            "w-full h-full min-h-[40px] p-1 text-sm hover:bg-notion-dark-hover rounded-md transition-colors",
                            hasEvents && "bg-blue-500/10 border border-blue-500/20",
                            isSameDay(date, new Date()) && "bg-notion-purple/20 text-notion-purple font-medium"
                          )}
                          onClick={() => { setSelectedDate(date); }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{format(date, 'd')}</span>
                            {hasEvents && (
                              <div className="flex gap-1 flex-wrap justify-center">
                                {events.slice(0, 2).map(event => (
                                  <div
                                    key={event.id}
                                    className={cn("w-2 h-2 rounded-full", event.color)}
                                  />
                                ))}
                                {events.length > 2 && (
                                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Info */}
          {selectedDate && (
            <Card className="bg-notion-dark border-notion-dark-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => { createEventForDate(selectedDate); }}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {getEventsForDate(selectedDate).map(event => (
                  <div
                    key={event.id}
                    className="p-2 rounded bg-notion-dark-hover border border-notion-dark-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", event.color)} />
                      <span className="text-sm text-white truncate">
                        {event.title}
                      </span>
                    </div>
                  </div>
                ))}
                
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Nenhum evento neste dia
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="bg-notion-dark border-notion-dark-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total de eventos</span>
                <span className="text-white">{calendarEvents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Este mês</span>
                <span className="text-white">{monthEvents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Campo de data</span>
                <span className="text-white text-xs truncate">
                  {primaryDateProperty.name}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-notion-dark border-notion-dark-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {calendarEvents
                .filter(event => event.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map(event => (
                  <div
                    key={event.id}
                    className="p-2 rounded bg-notion-dark-hover border border-notion-dark-border"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", event.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(event.date, 'dd/MM')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              
              {calendarEvents.filter(event => event.date >= new Date()).length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  Nenhum evento futuro
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
