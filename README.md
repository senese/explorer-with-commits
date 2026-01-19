# Explorer with Commits

A VSCode extension that enhances the Files Explorer by displaying the latest commit message for each file and directory, providing a GitHub-like experience within VSCode.

## Features

- 📝 **Commit Decorations**: Shows the latest commit message for each file in the Explorer
- ⚡ **Performance**: Built-in caching to minimize Git operations
- 🎨 **Customizable**: Configure what information to display (author, date, etc.)
- 🔄 **Auto-refresh**: Automatically updates when files are saved
- ✅ **Native Integration**: Uses VSCode's built-in Git extension API

## Installation

### From Source (Development)

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 in VSCode to launch the Extension Development Host

### From VSIX (Coming Soon)

Once published, you can install from the VSCode Marketplace or via a `.vsix` file.

## Usage

Once installed, the extension automatically activates when you open a folder with a Git repository. You'll see commit information displayed next to files in the Explorer:

- ✓ badge indicates the file has commit history
- Hover over files to see full commit details including message, author, and date

## Configuration

Access settings via `File > Preferences > Settings` and search for "Explorer with Commits":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `explorerWithCommits.enabled` | boolean | `true` | Enable/disable commit decorations |
| `explorerWithCommits.showAuthor` | boolean | `false` | Include commit author in tooltip |
| `explorerWithCommits.showDate` | boolean | `true` | Include commit date in tooltip |
| `explorerWithCommits.cacheDuration` | number | `300000` | Cache duration in milliseconds (5 minutes) |

## Development

### Prerequisites

- Node.js 20.x or higher
- VSCode 1.85.0 or higher

### Build Commands

```bash
npm install          # Install dependencies
npm run compile      # Build the extension
npm run watch        # Watch mode for development
npm test             # Run tests
npm run lint         # Lint TypeScript files
```

### Testing

Press F5 to launch the Extension Development Host and test your changes in a separate VSCode window.

Run automated tests:
```bash
npm test
```

### Project Structure

```
.
├── src/
│   ├── extension.ts           # Entry point, registers provider
│   ├── decorationProvider.ts  # FileDecorationProvider implementation
│   ├── gitService.ts          # Git API wrapper with caching
│   └── test/                  # Test files
├── package.json               # Extension manifest
├── tsconfig.json             # TypeScript configuration
└── .vscode/                  # VSCode debug/build configuration
```

## Architecture

The extension follows VSCode's recommended patterns:

- **FileDecorationProvider**: Implements `vscode.FileDecorationProvider` to decorate Explorer items
- **Built-in Git API**: Uses `vscode.extensions.getExtension('vscode.git')` for Git integration
- **Disposables Pattern**: All subscriptions are properly disposed on deactivation
- **In-memory Cache**: Map-based caching with configurable TTL to optimize performance

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for detailed architectural guidelines.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Credits

Developed by [senese](https://github.com/senese)
