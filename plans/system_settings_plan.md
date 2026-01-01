# System Settings Table Design

## Overview
The system currently lacks a `system_settings` table, causing the settings API to fall back to hardcoded defaults with the message "System settings table doesn't exist yet, returning defaults". We need to create a polymorphic settings table that can store settings related to different entities throughout the system.

## Requirements
- Create a `system_settings` table that supports polymorphic relationships
- Allow settings to be scoped to different entity types (users, branches, products, etc.)
- Support global system-wide settings
- Maintain backward compatibility with existing settings API
- Include proper security (RLS) and indexing

## Table Schema Design

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('user', 'branch', 'product', 'category', 'supplier', 'customer', 'role', 'global')),
  entity_id UUID,
  key TEXT NOT NULL,
  value TEXT,
  data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_system_wide BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique settings per entity or globally
  UNIQUE(entity_type, entity_id, key),

  -- For system-wide settings, entity_type and entity_id should be null
  CHECK (
    (is_system_wide = TRUE AND entity_type IS NULL AND entity_id IS NULL) OR
    (is_system_wide = FALSE AND entity_type IS NOT NULL AND entity_id IS NOT NULL)
  )
);
```

## Key Features

### Polymorphic Relationships
- `entity_type`: Specifies the type of entity the setting applies to
- `entity_id`: References the specific entity instance
- `is_system_wide`: Flag for global settings that apply system-wide

### Supported Entity Types
- `user`: User-specific settings
- `branch`: Branch-specific settings
- `product`: Product-specific settings
- `category`: Category-specific settings
- `supplier`: Supplier-specific settings
- `customer`: Customer-specific settings
- `role`: Role-specific settings
- `global`: Global settings (alternative to is_system_wide)

### Data Types
- `string`: Text values
- `number`: Numeric values (stored as strings for flexibility)
- `boolean`: True/false values
- `json`: Complex structured data

## Security (RLS Policies)

### Read Access
Users can read:
- System-wide settings (is_system_wide = TRUE)
- Their own user settings (entity_type = 'user', entity_id = auth.uid())
- Settings for branches they work at (for employees)
- All settings if they have admin/manager roles

### Write Access
Only admin users can create/update/delete settings.

## API Changes Required

### Current API (app/api/settings/route.ts)
The current API assumes a simple key-value store. It needs to be updated to:

1. Accept optional `entity_type` and `entity_id` query parameters
2. Filter settings based on the scope
3. Maintain backward compatibility for global settings

### Updated API Endpoints

#### GET /api/settings
- Query parameters: `entity_type`, `entity_id` (optional)
- If not provided, returns global settings (backward compatibility)
- Returns settings for the specified entity scope

#### POST /api/settings
- Body: `{ settings: {...}, entity_type?: string, entity_id?: string }`
- If entity_type/entity_id not provided, saves as global settings

## UI Changes Required

### SystemSettings Component
Currently shows global system settings. May need to be extended to:

1. Allow selection of different scopes (Global, Branch-specific, User-specific, etc.)
2. Show settings based on selected scope
3. Allow admins to manage settings for different entities

## Migration Strategy

1. Create the new table with the schema above
2. Populate with existing default settings as global settings
3. Update API to use the new table
4. Test existing functionality
5. Optionally extend UI for scoped settings

## Implementation Steps

1. Create SQL migration file
2. Update settings API routes
3. Add RLS policies
4. Test with existing settings UI
5. Extend UI for scoped settings (future enhancement)

## Benefits

- **Flexibility**: Settings can be scoped to different levels
- **Scalability**: Easy to add new entity types
- **Security**: Proper access control per entity
- **Backward Compatibility**: Existing global settings continue to work
- **Extensibility**: Can add new setting types and scopes easily