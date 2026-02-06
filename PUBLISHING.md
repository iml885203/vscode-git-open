# Publishing Guide

This guide explains how to publish the extension to VS Code Marketplace and Open VSX Registry.

## Prerequisites

### VS Code Marketplace

1. **Microsoft Account**: You need a Microsoft account with access to the publisher account
2. **Personal Access Token**: Generate a PAT at https://dev.azure.com with `Marketplace (Manage)` scope

### Open VSX Registry

1. **Eclipse Account**: Register at https://accounts.eclipse.org/user/register
2. **GitHub Account**: Link your GitHub account at https://open-vsx.org
3. **Publisher Agreement**: Sign the Publisher Agreement on your Open VSX profile page
4. **Access Token**: Generate a token at https://open-vsx.org (Settings → Access Tokens)
   - ⚠️ **Important**: The token is only shown once - save it securely
5. **Namespace**: Create your publisher namespace (one-time setup):
   ```bash
   npx ovsx create-namespace loganguo -p <your-token>
   ```

## Publishing Commands

The project includes three publishing scripts:

```bash
# Publish to VS Code Marketplace only
pnpm run vscode:publish

# Publish to Open VSX Registry only
pnpm run ovsx:publish -p <your-ovsx-token>

# Publish to both registries
pnpm run publish
```

## Recommended Publishing Workflow

### 1. Pre-publish Checks

Ensure all tests pass and the build is successful:

```bash
# Run all tests
pnpm run test

# Create production build
pnpm run package
```

### 2. Update Version

Update the version in `package.json` and document changes in `CHANGELOG.md`:

```json
{
  "version": "2026.2.0"
}
```

### 3. Commit and Tag

```bash
git add .
git commit -m "chore: release v2026.2.0"
git tag v2026.2.0
git push && git push --tags
```

### 4. Publish to Marketplaces

**Option A: Publish to both marketplaces**
```bash
# Set Open VSX token as environment variable
export OVSX_PAT=<your-ovsx-token>

# Publish to both registries
pnpm run publish
```

**Option B: Publish individually**
```bash
# Publish to VS Code Marketplace
pnpm run vscode:publish

# Publish to Open VSX
pnpm run ovsx:publish -p <your-ovsx-token>
```

### 5. Verify Publication

- **VS Code Marketplace**: https://marketplace.visualstudio.com/items?itemName=loganguo.git-open
- **Open VSX**: https://open-vsx.org/extension/loganguo/git-open

## Troubleshooting

### Authentication Failed

**VS Code Marketplace**:
- Verify your Personal Access Token is valid
- Check the token has `Marketplace (Manage)` scope
- Ensure you're authorized to publish under the `loganguo` publisher

**Open VSX**:
- Verify your access token is correct
- Check you've signed the Publisher Agreement
- Ensure the namespace `loganguo` exists and you own it

### Build Errors

If the `vscode:prepublish` script fails:
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Try building again
pnpm run package
```

### Version Already Exists

If the version is already published, you need to bump the version:
```bash
# Update version in package.json
# Then commit and publish again
```

## CI/CD Automation (Optional)

For automated publishing via GitHub Actions, consider using:
- [HaaLeo/publish-vscode-extension](https://github.com/HaaLeo/publish-vscode-extension)

Store tokens as GitHub secrets:
- `VSCE_PAT`: VS Code Marketplace token
- `OVSX_PAT`: Open VSX token

## Notes

- The `--no-dependencies` flag is used to reduce package size
- The `vscode:prepublish` script automatically runs before publishing
- Both registries use the same `.vsix` package format
- Publishing to both registries ensures wider distribution (VS Code, VSCodium, Code-OSS, etc.)
