# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.4] - 2025-05-11

### 🔄 Changed

- Removed `enhanced_search_npm` tool due to compatibility issues
- Updated fs.existsSync to fs.pathExistsSync for better compatibility with fs-extra

## [2.0.1] - 2025-05-10

### 🐛 Fixed

- Fixed critical MCP protocol compatibility issues:
  - Ensured all logging goes exclusively to stderr
  - Improved server startup sequence to maintain clean stdout
  - Fixed JSON-RPC communication handling
  - Removed stdout overrides that were causing protocol interference
- Enhanced error handling for more reliable operation with MCP clients
- Updated server initialization pattern to match MCP specification

## [0.3.0] - 2025-05-20

### ✨ Added

- Enhanced NPM search capabilities:
  - Added `enhanced_search_npm` tool for natural language package search using DuckDuckGo
  - Added `fetch_package_content` tool for scraping and extracting content from npm package pages
- Added cheerio dependency for HTML parsing
- Implemented rate limiting for API requests

## [0.2.0] - 2025-05-15

### ✨ Added

- Added `minimal` parameter to all ncu tools to prevent upgrading already-satisfied version ranges
- Added `packageManager` parameter to specify which package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)
- Added new `run_doctor` tool to iteratively test package upgrades and identify breaking changes
  - Supports custom install and test scripts
  - Automatically reverts breaking upgrades while keeping working ones

## [0.1.0] - 2025-05-10

### ✨ Added

- Initial release of npm-helper-mcp
- Model Context Protocol server implementation
- NPM Search functionality:
  - `search_npm`: Search for packages in npm registry
  - `get_package_versions`: Retrieve version history for a package
  - `get_package_details`: Fetch detailed package metadata
- npm-check-updates tools:
  - `check_updates`: Scan for outdated dependencies
  - `upgrade_packages`: Upgrade dependencies to latest versions
  - `filter_updates`: Check updates for specific packages
  - `resolve_conflicts`: Handle dependency conflicts
  - `set_version_constraints`: Configure version upgrade rules
- Comprehensive documentation:
  - Installation guide
  - API documentation
  - Usage examples

### 🔧 Technical
- Built with TypeScript
- Uses npm-check-updates under the hood
- Implements Model Context Protocol for LLM integration 