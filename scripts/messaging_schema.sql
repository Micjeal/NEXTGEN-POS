-- Create messages table for team messaging system
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role TEXT CHECK (recipient_role IN ('admin', 'manager', 'cashier')),
    message_type TEXT NOT NULL CHECK (message_type IN ('direct', 'role_based', 'broadcast')),
    subject TEXT,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'critical')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_role ON public.messages(recipient_role);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON public.messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON public.messages(parent_message_id);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;

-- Users can read messages sent to them, their role, or broadcasts
CREATE POLICY "Users can read their messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR
        auth.uid() = recipient_id OR
        recipient_role IN (
            SELECT r.name FROM public.roles r
            JOIN public.profiles p ON p.role_id = r.id
            WHERE p.id = auth.uid()
        ) OR
        message_type = 'broadcast'
    );

-- Users can insert messages
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update read status for messages sent to them
CREATE POLICY "Users can mark messages as read" ON public.messages
    FOR UPDATE USING (
        auth.uid() = recipient_id OR
        recipient_role IN (
            SELECT r.name FROM public.roles r
            JOIN public.profiles p ON p.role_id = r.id
            WHERE p.id = auth.uid()
        )
    ) WITH CHECK (auth.uid() = recipient_id);

-- Grant necessary permissions
GRANT ALL ON public.messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;