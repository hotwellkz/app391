import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhlzwqteygmxpxznezyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobHp3cXRleWdteHB4em5lenlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU1NDU2ODYsImV4cCI6MjAyMjEyMTY4Nn0.4_sQqBqHAUlZHnxY7TF0EbHOaOzVXJKC-rq-jkx4YRc';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
    CREATE TABLE IF NOT EXISTS public.whatsapp_chats (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        chats jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
    );

    ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
        DROP POLICY IF EXISTS "Enable all access" ON public.whatsapp_chats;
        CREATE POLICY "Enable all access" ON public.whatsapp_chats
            AS PERMISSIVE FOR ALL
            TO public
            USING (true)
            WITH CHECK (true);
    END $$;

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_whatsapp_chats_updated_at ON public.whatsapp_chats;
    CREATE TRIGGER update_whatsapp_chats_updated_at
        BEFORE UPDATE ON public.whatsapp_chats
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
`;

async function createTable() {
    try {
        // Проверим существует ли таблица
        const { data: existingTable, error: tableError } = await supabase
            .from('whatsapp_chats')
            .select('*')
            .limit(1);

        if (tableError && tableError.code === '42P01') {
            console.log('Table does not exist, creating...');
            
            // Создаем таблицу
            const { data, error } = await supabase
                .rpc('execute', { sql: sql });

            if (error) {
                console.error('Error creating table:', error);
            } else {
                console.log('Table created successfully:', data);
            }
        } else if (tableError) {
            console.error('Error checking table:', tableError);
        } else {
            console.log('Table already exists:', existingTable);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

createTable();
