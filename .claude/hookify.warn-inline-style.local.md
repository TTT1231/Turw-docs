---
name: warn-inline-style
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.html?$
  - field: new_text
    operator: regex_match
    pattern: style="[^"]*"
---

⚠️ **Inline style detected in HTML!**

You're adding a static `style="..."` attribute to an HTML element. Move styles to an external CSS file instead.

**Why this matters:**
- Inline styles bypass the CSS cascade and are hard to override
- They mix content with presentation, reducing maintainability

**How to fix:**
Extract the inline styles into an external `.css` file with a proper class selector
