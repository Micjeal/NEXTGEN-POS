-- Add sample notifications for testing the notifications page
-- This will create some test messages to populate the notifications

-- Get the first admin user ID for testing
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find an admin user
    SELECT p.id INTO admin_user_id
    FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE r.name = 'admin'
    LIMIT 1;

    -- If no admin found, get any user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id
        FROM profiles
        LIMIT 1;
    END IF;

    -- Insert sample messages if we have a user
    IF admin_user_id IS NOT NULL THEN
        -- Insert sample messages for different roles
        INSERT INTO messages (sender_id, recipient_role, message_type, subject, content, priority, is_read) VALUES
        (admin_user_id, 'admin', 'role_based', 'Welcome to the POS System', 'Your POS system is now fully operational with messaging and notifications!', 'normal', false),
        (admin_user_id, 'manager', 'role_based', 'System Maintenance Completed', 'All system maintenance tasks have been completed successfully.', 'normal', false),
        (admin_user_id, 'cashier', 'role_based', 'New Feature Available', 'Check out the new inventory management features now available!', 'urgent', false);

        -- Insert a broadcast message (visible to all users)
        INSERT INTO messages (sender_id, message_type, subject, content, priority, is_read) VALUES
        (admin_user_id, 'broadcast', '🎉 System Update Complete', 'The POS system has been successfully updated with new features including enhanced notifications, improved messaging, and better performance.', 'normal', false);

        RAISE NOTICE 'Sample notifications added successfully for user %', admin_user_id;
    ELSE
        RAISE NOTICE 'No users found in the system';
    END IF;
END $$;