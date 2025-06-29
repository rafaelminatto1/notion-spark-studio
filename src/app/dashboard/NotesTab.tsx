
import React, { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/feedback/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function NotesTab() {
  const { notes, isLoading, error, createNote, removeNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      createNote.mutate({ title, content }, {
        onSuccess: () => {
          setTitle('');
          setContent('');
        }
      });
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Nova Nota</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                placeholder="Título da nota"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={createNote.isPending}
              />
              <Textarea
                placeholder="Escreva sua nota aqui..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={createNote.isPending}
                rows={5}
              />
              <Button type="submit" className="w-full" disabled={createNote.isPending || !title.trim() || !content.trim()}>
                {createNote.isPending ? <Spinner /> : 'Salvar Nota'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Notas Recentes</h3>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <div className="text-red-500 text-center">Erro ao carregar notas.</div>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {notes.length === 0 ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EmptyState message="Nenhuma nota criada ainda." />
                 </motion.div>
              ) : (
                notes.map(note => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                          <CardDescription>{format(note.createdAt, 'dd/MM/yyyy HH:mm')}</CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeNote.mutate(note.id)}
                          disabled={removeNote.isPending}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
