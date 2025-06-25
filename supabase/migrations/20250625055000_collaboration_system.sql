-- Sistema de Colaboração em Tempo Real
-- Migração para comentários, presença, e edição colaborativa

-- Tabela de colaboradores de documentos
CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  selection_text TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de reações aos comentários
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('👍', '👎', '❤️', '😄', '😮', '😢', '😡')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction)
);

-- Tabela de presença de usuários
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position INTEGER,
  selection_start INTEGER,
  selection_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

-- Tabela de sessões de documento
CREATE TABLE IF NOT EXISTS public.document_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file', 'mention')),
  mentioned_users UUID[],
  reply_to UUID REFERENCES public.chat_messages(id),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de menções
CREATE TABLE IF NOT EXISTS public.mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  chat_message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_document_collaborators_document_id ON public.document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_user_id ON public.document_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON public.comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_document_id ON public.user_presence(document_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_document_sessions_document_id ON public.document_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sessions_user_id ON public.document_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_sessions_active ON public.document_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON public.chat_messages(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user_id ON public.mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_is_read ON public.mentions(is_read) WHERE is_read = false;

-- RLS Policies

-- Document Collaborators
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators of documents they have access to" ON public.document_collaborators
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = document_collaborators.document_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Document owners can manage collaborators" ON public.document_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = document_collaborators.document_id 
      AND dc.user_id = auth.uid() 
      AND dc.role = 'owner'
    )
  );

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on documents they have access to" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = comments.document_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on documents they have access to" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = comments.document_id 
      AND dc.user_id = auth.uid()
      AND dc.role IN ('owner', 'editor', 'commenter')
    )
  );

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Comment Reactions
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions on accessible comments" ON public.comment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.comments c 
      JOIN public.document_collaborators dc ON c.document_id = dc.document_id
      WHERE c.id = comment_reactions.comment_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own reactions" ON public.comment_reactions
  FOR ALL USING (auth.uid() = user_id);

-- User Presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence on documents they have access to" ON public.user_presence
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = user_presence.document_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Document Sessions
ALTER TABLE public.document_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sessions on documents they have access to" ON public.document_sessions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = document_sessions.document_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own sessions" ON public.document_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Chat Messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat on documents they have access to" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = chat_messages.document_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages on documents they have access to" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.document_collaborators dc 
      WHERE dc.document_id = chat_messages.document_id 
      AND dc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Mentions
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mentions directed to them" ON public.mentions
  FOR SELECT USING (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can create mentions" ON public.mentions
  FOR INSERT WITH CHECK (auth.uid() = mentioned_by);

CREATE POLICY "Users can update mentions directed to them" ON public.mentions
  FOR UPDATE USING (auth.uid() = mentioned_user_id);

-- Functions para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_document_collaborators_updated_at 
    BEFORE UPDATE ON public.document_collaborators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at 
    BEFORE UPDATE ON public.user_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON public.chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar sessões inativas
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    UPDATE public.document_sessions 
    SET is_active = false, ended_at = NOW()
    WHERE is_active = true 
    AND last_activity < NOW() - INTERVAL '30 minutes';
    
    UPDATE public.user_presence 
    SET status = 'offline'
    WHERE status != 'offline' 
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ language 'plpgsql';

-- Função para notificar menções
CREATE OR REPLACE FUNCTION notify_mention()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir notificação para o usuário mencionado
    INSERT INTO public.mentions (
        document_id,
        comment_id,
        chat_message_id,
        mentioned_user_id,
        mentioned_by
    ) VALUES (
        NEW.document_id,
        CASE WHEN TG_TABLE_NAME = 'comments' THEN NEW.id ELSE NULL END,
        CASE WHEN TG_TABLE_NAME = 'chat_messages' THEN NEW.id ELSE NULL END,
        -- Extrair usuários mencionados do conteúdo (simplificado)
        NULL, -- Implementar parsing de @mentions
        NEW.user_id
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql'; 