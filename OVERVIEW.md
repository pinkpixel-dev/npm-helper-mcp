# 📦 npm-helper-mcp: Project Overview

## Project Information
- **Name**: npm-helper-mcp
- **Version**: 2.0.5
- **Date Last Updated**: May 10, 2025
- **Author**: Pink Pixel

## 📋 Project Description

npm-helper-mcp is a Model Context Protocol (MCP) server designed to help with NPM dependency management. It provides tools for NPM package search and uses npm-check-updates to manage and upgrade dependencies. The server allows LLMs (Large Language Models) to interact with npm packages and dependency management through a standardized MCP interface.

## 🏗️ Architecture

The project follows a clean architecture pattern with these main components:

1. **MCP Server** - Implements the Model Context Protocol server that handles requests from LLMs.
2. **NPM Searcher** - Class for handling npm package search and metadata retrieval.
3. **NPM Check Updates Handler** - Handles dependency checking and updating using npm-check-updates library.

## 🛠️ Core Functionality

### NPM Package Search Tools
- **searchPackages**: Search npmjs.org registry for packages
- **fetchPackageContent**: Scrape and extract content from npm package pages
- **getPackageVersions**: Retrieve version history of packages
- **getPackageDetails**: Fetch detailed package metadata

### npm-check-updates Tools
- **checkUpdates**: Scan package.json for outdated dependencies
- **upgradePackages**: Upgrade dependencies to latest versions
- **filterUpdates**: Check updates for specific packages
- **resolveConflicts**: Handle dependency conflicts
- **setVersionConstraints**: Configure version upgrade rules
- **runDoctor**: Iteratively run upgrades and tests to detect breaking changes

## 📚 Dependencies

### Runtime Dependencies
- `@modelcontextprotocol/sdk`: ^1.11.1 - Core MCP SDK for implementing the server
- `axios`: ^1.9.0 - HTTP client for making requests
- `npm-check-updates`: ^18.0.1 - Core library for checking and upgrading npm dependencies
- `chalk`: ^5.4.1 - Terminal string styling
- `cheerio`: ^1.0.0 - Fast, flexible HTML parser for scraping npm pages
- `commander`: ^13.1.0 - Command-line interface utility
- `fs-extra`: ^11.3.0 - Enhanced file system methods

### Development Dependencies
- `typescript`: ^5.8.3 - TypeScript compiler and types
- `eslint`: ^9.26.0 - Code linting
- Various TypeScript types (@types/node, @types/fs-extra, @types/cheerio)

## 📁 File Structure

```
npm-helper-mcp/
├── dist/              # Compiled JavaScript output
├── docs/               # Documentation files
├── .gitignore          # Git ignore file
├── CHANGELOG.md        # Project changelog
├── example_config.json # Example MCP configuration
├── index.ts            # Main source file
├── package.json        # NPM package configuration
├── package-lock.json   # NPM dependency lock file
├── README.md           # Project readme
└── tsconfig.json       # TypeScript configuration
```

## 📖 MCP Integration

This project implements the Model Context Protocol, which provides a standardized way for LLMs to use external tools. The server can be configured in an MCP configuration file to allow LLMs like Claude to call its tools through a standardized interface.

Example configuration:
```json
{
  "mcpServers": {
    "npm-helper": {
      "command": "npx",
      "args": [
          "-y",
          "@pinkpixel/npm-helper-mcp"
      ]
    }
  }
}
```

## 🚀 Usage

### Start the MCP Server

```bash
npm start
```

This will start the MCP server on stdio, allowing it to communicate with an LLM.

## 📈 Project Status

The project is actively maintained and has seen regular updates, with the latest version including enhanced search capabilities, HTML scraping, rate limiting, and doctor functionality for testing package upgrades.

---

✨ Created with ❤️ by Pink Pixel 