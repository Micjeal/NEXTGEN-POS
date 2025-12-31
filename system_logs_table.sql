-- Create system_logs table for maintenance logging
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read all logs
CREATE POLICY "Admins can read all system logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role_id IN (
                SELECT id FROM roles WHERE name = 'admin'
            )
        )
    );

-- Create policy for system to insert logs
CREATE POLICY "System can insert logs" ON system_logs
    FOR INSERT WITH CHECK (true);