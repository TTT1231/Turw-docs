---
name: check-vitepress-links
enabled: true
event: bash
pattern: git\s+commit
action: block
---

**VitePress Link Integrity Check Required**

Before proceeding with this git commit, you MUST verify that all links in `docs/.vitepress/config.mts` are valid (no broken/dead links).

**Verification Steps:**

1. Read `docs/.vitepress/config.mts`
2. Extract ALL `link:` values from both `nav` and `sidebar` configuration
3. For each link value (e.g. `/frontdesign/css-layout`), check if the corresponding file exists at:
   - `docs{link}.md` (e.g. `docs/frontdesign/css-layout.md`)
   - OR `docs{link}/index.md` (e.g. `docs/frontdesign/css-layout/index.md`)
4. Also check that any markdown files referenced in recently changed/added docs exist

**Decision:**
- If ALL links resolve to existing files → the commit is allowed, proceed with git commit
- If ANY link points to a non-existent file → **BLOCK the commit immediately** and report:
  - The broken link path
  - What file it was expected to be at
  - Suggest the correct path or ask the user if the file needs to be created

**Important:** Do NOT skip this check. This ensures no broken sidebar or navigation links reach production.
