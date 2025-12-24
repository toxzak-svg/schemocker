# GitHub Repository Setup Guide

This guide explains how to configure the GitHub repository metadata to make it look professional and complete.

## Repository Settings to Update

### 1. Repository Description and Website

Go to your repository settings:
1. Navigate to https://github.com/toxzak-svg/schemock-app
2. Click the ⚙️ **Settings** tab
3. In the **General** section, update:

**Description:**
```
Lightweight mock server generator from JSON schemas - Create RESTful APIs instantly for testing and development
```

**Website:**
```
https://github.com/toxzak-svg/schemock-app
```

_(Or use a custom domain if you deploy documentation, e.g., https://schemock.dev)_

### 2. Repository Topics

In the same **General** section, click **Add topics** and add:

- `mock-server`
- `json-schema`
- `rest-api`
- `api-mocking`
- `testing`
- `development-tools`
- `cli-tool`
- `nodejs`
- `typescript`
- `express`

These topics help users discover your project through GitHub's topic search.

### 3. Enable/Disable Features

Still in Settings → General, ensure these are enabled:
- ✅ **Issues** - Allow users to report bugs and request features
- ✅ **Projects** - Optional, for project management
- ✅ **Discussions** - Optional, for community Q&A
- ✅ **Wiki** - Optional, for extended documentation

### 4. About Section (Main Page)

On your main repository page:
1. Click the ⚙️ gear icon next to "About"
2. Fill in:
   - **Description**: Same as above
   - **Website**: `https://github.com/toxzak-svg/schemock-app`
   - **Topics**: Add the topics listed above
   - Check ✅ **Releases** if you want to show latest release
   - Check ✅ **Packages** if relevant

## Optional: Social Preview Image

Create a professional social preview image (1280x640px) that appears when sharing on social media:

1. Go to Settings → General
2. Scroll to **Social preview**
3. Click **Edit** and upload an image
4. Recommended: Create a banner with:
   - Project name "Schemock"
   - Tagline "Mock Server from JSON Schemas"
   - Visual element (terminal screenshot, logo, or icon)

## Repository Homepage Enhancement

### Add Repository Badges

The README.md already includes badges at the bottom. You can add more at the top if desired:

```markdown
[![npm version](https://img.shields.io/npm/v/schemock.svg)](https://www.npmjs.com/package/schemock)
[![Build Status](https://github.com/toxzak-svg/schemock-app/workflows/CI/badge.svg)](https://github.com/toxzak-svg/schemock-app/actions)
[![Coverage Status](https://coveralls.io/repos/github/toxzak-svg/schemock-app/badge.svg?branch=main)](https://coveralls.io/github/toxzak-svg/schemock-app?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Recommended Additional Setup

### 1. Create First Release

Once you're ready to share:
1. Go to **Releases** → **Create a new release**
2. Tag version: `v1.0.0`
3. Release title: `Schemock v1.0.0 - Initial Release`
4. Description: Highlight key features
5. Upload `schemock.exe` and `Schemock-Setup.exe` as release assets

### 2. Add License File

You already have a LICENSE file. Verify it shows in the repository sidebar.

### 3. Create Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md` for consistent issue reporting.

### 4. Add Security Policy

Create `SECURITY.md` (you might already have this) with vulnerability reporting instructions.

### 5. Set Up GitHub Actions (Optional)

Create `.github/workflows/ci.yml` for automated testing on push/PR.

## Current Status

✅ All repository URLs updated in:
- README.md
- package.json
- All documentation files
- Build scripts
- Installer configuration
- Source code

⏳ Pending manual setup:
- Repository description and website
- Repository topics
- About section configuration
- Social preview image (optional)

## Quick Checklist

- [ ] Set repository description
- [ ] Set repository website URL
- [ ] Add repository topics
- [ ] Configure About section
- [ ] Enable Issues
- [ ] Create first release
- [ ] Upload release assets (schemock.exe, installer)
- [ ] Add social preview image (optional)
- [ ] Set up GitHub Actions CI (optional)

---

**Note**: Once these are set up, your repository will appear more professional and be easier to discover through GitHub search and topic browsing.
