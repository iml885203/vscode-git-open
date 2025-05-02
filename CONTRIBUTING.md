# Contributing Guide

## Packaging the Extension (VSIX)

This project uses [VSCE](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) to package the VSCode extension. If you need to create a `.vsix` file for local testing or distribution, please follow these instructions:

### Prerequisites

1. Ensure you have Node.js and pnpm installed.
2. Install the VSCE CLI globally if you haven't already:
   ```bash
   pnpm add -g @vscode/vsce
   ```

### Packaging Command

From the root of the project, run:

```bash
vsce package --no-dependencies
```

- The `--no-dependencies` flag skips automatic npm install during packaging. This is suitable for development environments where dependencies are already installed, making packaging faster and avoiding redundant installations.
- After running the command, a `.vsix` file will be generated. You can use this file to install the extension locally in VSCode via "Install from VSIX" for testing.

### Troubleshooting

- If you encounter missing dependencies or packaging errors, make sure to run `pnpm install` to ensure all dependencies are present.
- If you want to include dependencies during packaging, simply omit the `--no-dependencies` flag.

### References

- [VSCE Documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
