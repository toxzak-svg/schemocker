# Schemock Example Schemas

This folder contains ready-to-use JSON schema examples demonstrating different use cases and features.

## Quick Start

```powershell
# Navigate to schemock directory
cd C:\path\to\schemock

# Run any example
.\schemock.exe start examples\simple-user.json
```

## Available Examples

### 1. Simple User (`simple-user.json`)
**Perfect for:** Getting started, tutorials, basic demos

A basic user management schema with common fields:
- UUID identifier
- Name and email
- Age with constraints
- Boolean flags
- Date-time stamps

```powershell
.\schemock.exe start examples\simple-user.json
# Open: http://localhost:3000/api/data
```

**Use Case:** Frontend developers building user profile pages, authentication flows, or simple CRUD applications.

---

### 2. E-commerce Product (`ecommerce-product.json`)
**Perfect for:** Online stores, product catalogs, shopping apps

Comprehensive product schema with:
- Product details (name, description, price)
- Categories and tags
- Stock status and ratings
- Multiple images
- Price constraints (min/max, decimal precision)

```powershell
.\schemock.exe start examples\ecommerce-product.json --port 3001
# Open: http://localhost:3001/api/data
```

**Use Case:** Building e-commerce frontends, product listing pages, shopping carts, or inventory systems.

**Features Demonstrated:**
- Enum types (categories)
- Arrays with constraints (tags, images)
- Number precision (price with multipleOf)
- URI format (image URLs)

---

### 3. Social Media User (`social-user.json`)
**Perfect for:** Social networks, community platforms, user profiles

Rich user profile with:
- Username with pattern validation
- Nested profile object (bio, avatar, location)
- User statistics (followers, following, posts)
- Verification status
- Join date tracking

```powershell
.\schemock.exe start examples\social-user.json --port 3002
# Open: http://localhost:3002/api/data
```

**Use Case:** Social media apps, community platforms, professional networks, or any app with rich user profiles.

**Features Demonstrated:**
- Nested objects (profile, stats)
- String patterns (username validation)
- Complex data structures
- Multiple format types

---

### 4. Task Management (`task-management.json`)
**Perfect for:** Project management, todo apps, workflow systems

Complete task schema with:
- Task details (title, description)
- Status workflow (todo → in-progress → review → done)
- Priority levels (low to urgent)
- Assignee information
- Due dates and timestamps
- Tags for organization

```powershell
.\schemock.exe start examples\task-management.json --port 3003
# Open: http://localhost:3003/api/data
```

**Use Case:** Project management tools, kanban boards, issue trackers, or workflow applications.

**Features Demonstrated:**
- Workflow enums (status)
- Priority levels
- Nested assignee object
- Multiple date fields
- Flexible tagging

---

### 5. Blog API (`blog-api.json`)
**Perfect for:** CMS, blogging platforms, content management systems

Complete blog post schema with:
- Rich post content (title, excerpt, markdown content)
- Author information with nested profile
- Categories and tags
- Publication workflow (draft, published, archived)
- Metadata (reading time, views, likes)
- Comments array
- Featured image and status flags

```powershell
.\schemock.exe start examples\blog-api.json --port 3004
# Open: http://localhost:3004/api/data
```

**Use Case:** Blogging platforms, content management systems, news sites, or any content-driven application.

**Features Demonstrated:**
- Complex nested objects (author, metadata, comments)
- Enum-based status workflows
- Array with nested objects (comments)
- Multiple format types (uuid, email, uri, date-time)
- Pattern validation (slug field)
- Multiple constraints (minLength, maxLength, minItems, maxItems)

---

### 6. Auth User + Profile (`auth-user-profile.json`)
**Perfect for:** Authentication flows, user settings, profile management

Complete user authentication and profile schema with:
- User identity (ID, username, email)
- Profile details (fullName, bio, avatar)
- Location information
- User preferences (theme, language, notifications)
- Social media links
- User statistics (followers, following, posts)
- Verification status
- Activity timestamps

```powershell
.\schemock.exe start examples\auth-user-profile.json --port 3005
# Open: http://localhost:3005/api/data
```

**Use Case:** Building authentication screens, user profile pages, settings forms, or any app with user accounts.

**Features Demonstrated:**
- Nested objects (location, preferences, social, stats)
- Complex preference structure
- Social media integration fields
- User activity tracking
- Enum-based theme selection

---

### 7. Product List (`product-list.json`)
**Perfect for:** E-commerce frontends, product catalogs, filtering interfaces

Comprehensive product catalog with:
- Array of products with rich details
- Product pricing (price, compareAtPrice, discount)
- Product images and variants
- Category and brand information
- Stock status and ratings
- Tags and metadata
- Pagination controls
- Filter options (categories, price range, brands, rating)

```powershell
.\schemock.exe start examples\product-list.json --port 3006
# Open: http://localhost:3006/api/data
```

**Use Case:** Building e-commerce product listings, category pages, search results, or product comparison views.

**Features Demonstrated:**
- Large array with complex items
- Pagination metadata
- Filter configuration
- Product variants
- Discount calculations
- Rating and review counts

---

### 8. Shopping Cart (`cart.json`)
**Perfect for:** Checkout flows, e-commerce apps, shopping cart management

Complete shopping cart schema with:
- Cart items with product details
- Quantity and pricing calculations
- Product variants and availability
- Cart summary (subtotal, discount, tax, shipping, total)
- Coupon codes
- Shipping and billing addresses
- Payment method information
- Currency support

```powershell
.\schemock.exe start examples\cart.json --port 3007
# Open: http://localhost:3007/api/data
```

**Use Case:** Building shopping cart pages, checkout forms, order summaries, or payment flows.

**Features Demonstrated:**
- Complex nested structures (items, addresses, payment)
- Array of cart items with calculations
- Multiple address types
- Payment method details
- Coupon system
- Currency formatting

---

### 9. Dashboard Cards (`dashboard-cards.json`)
**Perfect for:** Admin dashboards, analytics panels, business intelligence

Complete dashboard analytics schema with:
- Overview metrics (revenue, users, conversion rates)
- KPI cards with trends and changes
- Recent activity feed
- Charts data (revenue by month, top products, user acquisition)
- System alerts
- Color-coded indicators
- Actionable links

```powershell
.\schemock.exe start examples\dashboard-cards.json --port 3008
# Open: http://localhost:3008/api/data
```

**Use Case:** Building admin dashboards, analytics panels, business intelligence tools, or monitoring systems.

**Features Demonstrated:**
- KPI cards with trend arrays
- Multiple chart data structures
- Activity feed with different types
- Alert system with severity levels
- Color coding and icons
- Metadata and actionable items

---

### 10. Activity Feed (`activity-feed.json`)
**Perfect for:** Social networks, activity timelines, notification systems

Social activity feed with:
- Activity items (posts, comments, likes, shares, follows)
- Rich user information
- Media attachments (images, videos, links)
- Mentions and hashtags
- Location data
- Engagement statistics (likes, comments, shares, views)
- Comments nested in activities
- Privacy settings
- Pagination controls
- Trending topics and suggested users

```powershell
.\schemock.exe start examples\activity-feed.json --port 3009
# Open: http://localhost:3009/api/data
```

**Use Case:** Building social feeds, activity timelines, notification systems, or real-time updates.

**Features Demonstrated:**
- Complex activity types with enums
- Nested comments
- Media arrays
- User mentions and hashtags
- Location coordinates
- Engagement statistics
- Trending algorithms
- User recommendations

---

## Testing All Examples

Use the provided demo script to test all examples:

```powershell
.\demo-script.ps1
```

This will:
- ✅ Test each example schema
- ✅ Show you what data is generated
- ✅ Guide you through taking screenshots
- ✅ Demonstrate different configuration options

## Creating Your Own Schema

### Basic Template

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Your API Name",
  "description": "What this API does",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    }
  },
  "required": ["id", "name"]
}
```

### Supported Data Types

- **String**: `"type": "string"`
  - Formats: `email`, `uuid`, `uri`, `date-time`, `date`, `time`
  - Constraints: `minLength`, `maxLength`, `pattern`
  - Enums: `"enum": ["value1", "value2"]`

- **Number/Integer**: `"type": "number"` or `"type": "integer"`
  - Constraints: `minimum`, `maximum`, `multipleOf`
  - Exclusive: `exclusiveMinimum`, `exclusiveMaximum`

- **Boolean**: `"type": "boolean"`

- **Array**: `"type": "array"`
  - Items: `"items": { "type": "string" }`
  - Constraints: `minItems`, `maxItems`, `uniqueItems`

- **Object**: `"type": "object"`
  - Properties: `"properties": { ... }`
  - Required: `"required": ["field1", "field2"]`

- **Null**: `"type": "null"`

### Advanced Features

```json
{
  "oneOf": [
    { "type": "string" },
    { "type": "number" }
  ],
  "anyOf": [...],
  "allOf": [...],
  "not": { "type": "null" },
  "$ref": "#/definitions/myDefinition"
}
```

## Common Use Cases

### User Authentication
Start with `simple-user.json` and add:
- Password hash field
- Roles/permissions
- Login timestamps
- Session tokens

### Blog/CMS
Create schema with:
- Post title, content, excerpt
- Author information
- Categories and tags
- Publish date, updated date
- Comments count

### Financial/Invoicing
Include:
- Amount with precise decimals (`multipleOf: 0.01`)
- Currency enum
- Status (draft, sent, paid)
- Line items array
- Tax calculations

### Booking/Reservation
Add fields for:
- Date ranges
- Status workflow
- Customer details
- Resource allocation
- Pricing tiers

## Tips for Great Schemas

1. **Use Descriptive Titles**: Help users understand the schema purpose
2. **Add Descriptions**: Document each field for clarity
3. **Set Realistic Constraints**: Use min/max values that make sense
4. **Choose Appropriate Formats**: Use `uuid` for IDs, `email` for emails, etc.
5. **Mark Required Fields**: Specify which fields must be present
6. **Use Enums for Fixed Sets**: Better than arbitrary strings
7. **Nest Related Data**: Group related fields in objects

## Need More Examples?

Check out these resources:
- [JSON Schema Official Examples](https://json-schema.org/learn/miscellaneous-examples.html)
- [JSON Schema Store](https://www.schemastore.org/json/)
- [Schemock Documentation](../docs/user-guide.md)

## Troubleshooting

**Problem:** Data doesn't look realistic
**Solution:** Use specific formats (`uuid`, `email`, `uri`, `date-time`) instead of plain strings

**Problem:** Numbers are too large/small
**Solution:** Add `minimum` and `maximum` constraints

**Problem:** Need specific values
**Solution:** Use `enum` for fixed sets, or `pattern` for strings

**Problem:** Array is empty or too long
**Solution:** Add `minItems` and `maxItems` constraints

## Contributing Examples

Have a great example schema? Please contribute!

1. Create your schema in this folder
2. Test it: `.\schemock.exe start examples\your-schema.json`
3. Add it to this README
4. Submit a pull request

---

**Happy Mocking! 🚀**

For more information, see the [Main Documentation](../README.md)
