export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

let notes: Note[] = [
  { id: '1', title: 'Nota de Boas-vindas', content: 'Este é um exemplo de nota no seu novo dashboard.', createdAt: new Date() },
  { id: '2', title: 'Ideias para o Projeto', content: ' - Refatorar a autenticação.\n - Adicionar tema escuro.', createdAt: new Date() },
];

export const NoteService = {
  list(): Promise<Note[]> {
    return Promise.resolve([...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  },
  
  create(data: { title: string; content: string }): Promise<Note> {
    const newNote: Note = { 
      id: Date.now().toString(), 
      title: data.title,
      content: data.content,
      createdAt: new Date(),
    };
    notes = [newNote, ...notes];
    return Promise.resolve(newNote);
  },

  remove(id: string): Promise<void> {
    notes = notes.filter(n => n.id !== id);
    return Promise.resolve();
  },
}; 