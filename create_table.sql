-- Create whatsapp_chats table
CREATE TABLE IF NOT EXISTS public.whatsapp_chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    chats jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Enable all access" ON public.whatsapp_chats
    AS PERMISSIVE FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_chats_updated_at
    BEFORE UPDATE ON public.whatsapp_chats
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
