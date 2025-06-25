-- Configurar políticas para storage de uploads
-- Criar tabela para tracking de uploads
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_document_id ON public.file_uploads(document_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON public.file_uploads(created_at);

-- RLS policies
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios uploads
CREATE POLICY "Users can view own uploads" ON public.file_uploads
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir uploads
CREATE POLICY "Users can insert uploads" ON public.file_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios uploads
CREATE POLICY "Users can update own uploads" ON public.file_uploads
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios uploads
CREATE POLICY "Users can delete own uploads" ON public.file_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- Criar tabela de templates
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_document_templates_category ON public.document_templates(category);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_public ON public.document_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_document_templates_created_by ON public.document_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_document_templates_usage_count ON public.document_templates(usage_count DESC);

-- RLS para templates
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ver templates públicos
CREATE POLICY "Anyone can view public templates" ON public.document_templates
  FOR SELECT USING (is_public = true);

-- Policy: Usuários podem ver seus próprios templates
CREATE POLICY "Users can view own templates" ON public.document_templates
  FOR SELECT USING (auth.uid() = created_by);

-- Policy: Usuários podem criar templates
CREATE POLICY "Users can create templates" ON public.document_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Usuários podem atualizar seus próprios templates
CREATE POLICY "Users can update own templates" ON public.document_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Usuários podem deletar seus próprios templates
CREATE POLICY "Users can delete own templates" ON public.document_templates
  FOR DELETE USING (auth.uid() = created_by);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_file_uploads_updated_at 
    BEFORE UPDATE ON public.file_uploads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at 
    BEFORE UPDATE ON public.document_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 