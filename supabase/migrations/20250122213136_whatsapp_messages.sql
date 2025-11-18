
-- Добавляем новые поля в таблицу whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS message_type text CHECK (message_type in ('text', 'template', 'media')) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS template_name text,
ADD COLUMN IF NOT EXISTS media_url text;

-- Добавляем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_number_idx ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS whatsapp_messages_created_at_idx ON public.whatsapp_messages(created_at);

-- Включаем Row Level Security
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Создаем политики безопасности
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'whatsapp_messages' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" 
        ON public.whatsapp_messages
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'whatsapp_messages' 
        AND policyname = 'Enable insert access for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert access for authenticated users" 
        ON public.whatsapp_messages
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'whatsapp_messages' 
        AND policyname = 'Enable update access for authenticated users'
    ) THEN
        CREATE POLICY "Enable update access for authenticated users" 
        ON public.whatsapp_messages
        FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END
$$;