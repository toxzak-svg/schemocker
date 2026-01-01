# Growth Features Quick Start

## Get Started in 5 Minutes

### 1. See the Branding in Action

```bash
# Start Schemock
npm start

# Make an API call
curl http://localhost:3000/api/users

# Response includes branding:
# Headers: X-Powered-By: Schemock v1.0.1
# Body: { ... "_meta": { "generated_by": "Schemock", ... } }
```

### 2. Share Your Schema

```bash
# Open the playground
# Go to http://localhost:3000
# Click "🔗 Share Schema" button
# Share the URL with your team!
```

### 3. Browse the Gallery

```bash
# Visit http://localhost:3000/api/gallery
# See 3 example schemas:
# - E-commerce Product API
# - Social Media Post Schema
# - User Profile API
```

### 4. Remove Branding (Paid Users)

```bash
# Add --hide-branding flag
schemock start schema.json --hide-branding

# Or in schemock.json:
{
  "server": {
    "port": 3000,
    "hideBranding": true
  }
}
```

---

## API Endpoints

### Share Schema
```
GET /api/share
```
Returns your current schema configuration for sharing.

### Public Gallery
```
GET /api/gallery
```
Returns list of public schemas you can use as templates.

---

## Growth Mechanics

### How Sharing Works
1. Developer creates mock API
2. Clicks "Share Schema" button
3. Gets shareable URL
4. Shares with team → Team sees "Made with Schemock"
5. Team installs → They share → Viral loop! 🔄

### Branding Exposure
Every API response includes:
- **Header**: `X-Powered-By: Schemock v1.0.1`
- **Metadata**: `_meta.generated_by`, `_meta.url`
- **Footer**: "Made with ❤️ Schemock"

When developers share:
- Postman collections → Team sees headers
- API documentation → Team sees metadata
- Code examples → Team sees branding

### Gallery Discovery
- New users find Schemock via Google
- Each schema includes Schemock URL
- Reduces onboarding friction
- Creates community content

---

## Success Patterns

### Figma Model
- ✅ One-click sharing
- ✅ Collaborative workspaces
- ✅ Branding on every shared file

### Cursor AI Model  
- ✅ VS Code integration
- ✅ Meet developers where they work
- ✅ Seamless workflow

### Postman Model
- ✅ Public collections/gallery
- ✅ Community content
- ✅ Searchable examples

---

## Quick Tips

**For Maximum Growth:**
1. Always use shareable URLs (localhost:PORT/api/share)
2. Encourage team members to share their schemas
3. Use public gallery schemas as examples
4. Keep branding enabled to drive discovery

**For Teams:**
1. Share schemas via Slack/Discord
2. Add schemas to team documentation
3. Use consistent naming conventions
4. Create team-specific schemas

**For Individual Developers:**
1. Share with colleagues on projects
2. Use gallery schemas as templates
3. Show playground to teammates
4. Mention Schemock in code reviews

---

## Examples

### Example: E-commerce Product API

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Product",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "price": { "type": "number", "minimum": 0 },
    "category": { 
      "type": "string", 
      "enum": ["electronics", "clothing", "books"] 
    },
    "inStock": { "type": "boolean" }
  },
  "required": ["id", "name", "price", "category"]
}
```

**Share it with team:**
```bash
schemock start product-schema.json
# Visit http://localhost:3000
# Click "🔗 Share Schema"
# Send link to team!
```

### Example: Social Media Post API

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Post",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "title": { "type": "string" },
    "content": { "type": "string" },
    "author": { "type": "string" },
    "likes": { "type": "number" },
    "comments": { 
      "type": "array", 
      "items": { "type": "string" } 
    }
  },
  "required": ["id", "title", "content", "author"]
}
```

---

## Growth Metrics

Track these to measure impact:

**Weekly:**
- [ ] Schemas shared
- [ ] Team members activated
- [ ] Gallery visits

**Monthly:**
- [ ] Viral coefficient
- [ ] Brand impressions (API calls × shared)
- [ ] New signups from shares

---

## Resources

- Full documentation: `GROWTH-FEATURES.md`
- Production readiness: `PRODUCTION-READINESS-REPORT-v1.0.1.md`
- GitHub: https://github.com/toxzak-svg/schemock-app
- Issues: https://github.com/toxzak-svg/schemock-app/issues

---

## FAQ

**Q: Can I disable branding?**
A: Yes, use `--hide-branding` flag (paid users)

**Q: How do I add my schema to the gallery?**
A: Currently only internal, public marketplace coming in v1.1.0

**Q: Can I share schemas with non-developers?**
A: Yes! Share URL works for anyone, they can explore via playground

**Q: Does branding affect performance?**
A: No, minimal overhead (<1ms)

**Q: Can I customize the branding message?**
A: Not in v1.0.1, coming in future versions

---

**Start sharing and growing today! 🚀**

*Last Updated: January 1, 2026*
*Version: 1.0.1*
