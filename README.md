[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/pinkpixel-dev-npm-helper-mcp-badge.png)](https://mseep.ai/app/pinkpixel-dev-npm-helper-mcp)

<div align="center">
  <img src="https://res.cloudinary.com/di7ctlowx/image/upload/v1746886361/npm-helper-mcp-icon_tkot9i.png" alt="NPM Helper MCP Logo" width="300" height="300"/>
</div>

# 📦 NPM Helper - A tool to help your ai assistant with npm package management.🤖 [![npm version](https://img.shields.io/npm/v/@pinkpixel/npm-helper-mcp.svg)](https://www.npmjs.com/package/@pinkpixel/npm-helper-mcp)

A Model Context Protocol server for NPM dependency management. This server provides tools for NPM package search and tools for updating npm packages, ensuring your project's dependencies are up to date and updated to their latest compatible versions, without any conflicts or headaches.

**As a baseline, for a safe upgrade of any project's package.json, your assistant can call the upgradePackagets tool with the 'peer' parameter set to true. This will likely not update all of your dependencies to the latest versions, but it will safely upgrade them to the latest compatible versions, without any errors.**

If you are looking for a full upgrade of all dependencies, your assistant has many tools and parameters to safely explore. Parameter options and examples are provider below, in the "Available Tools" section. You can also find more information in the 'docs' directory.

There are also tools available to search and retrieve information from npmjs, if you are exploring options for new packages to add to your project, or if you are looking for information on a specific package.

## ✨ Features

### npm-check-updates Tools

- 🔍 **checkUpdates**: Scan package.json for outdated dependencies
- 🚀 **upgradePackages**: Upgrade dependencies to latest versions
- 🔎 **filterUpdates**: Check updates for specific packages
- 🔄 **resolveConflicts**: Handle dependency conflicts
- ⚙️ **setVersionConstraints**: Configure version upgrade rules
- 🩺 **runDoctor**: Iteratively run upgrades and tests to detect breaking changes

### NPM Search Tools

- 🔍 **searchPackages**: Search npmjs.org registry for packages
- 📝 **fetchPackageContent**: Scrape and extract content from npm package pages
- 📋 **getPackageVersions**: Retrieve version history of packages
- 📝 **getPackageDetails**: Fetch detailed package metadata

# 🚀 npm-helper-mcp Installation Guide

This guide will help you set up and run the npm-helper-mcp server.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.x or later)
- npm (version 8.x or later)

## 🔧 Configuration

The npm-helper-mcp server implements the Model Context Protocol, which enables it to communicate with LLM applications that support the protocol.

Configuration varies depending on the application. Generally, most mcp client applications will have a .json configuration file, or a place to enter the command to run the server. One of these 2 options should work in most cases.

### Option 1: Run with npx

The easiest way to use the server is to run it with npx, which requires no local installation. Depending on your mcp client, use one of the following 2 methods:

1. Copy and paste the json configuration into your application's mcp configuration file.

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

2. Enter the command to run the server in your application's mcp configuration settings.

```bash
  npx -y @pinkpixel/npm-helper-mcp
```

### Option 2: Local installation

If you prefer to install the server locally, you can do so with the following command:

```bash
# Install the package globally
npm install -g npm-helper-mcp
```

Configuration:

1. Copy and paste the json configuration into your application's mcp configuration file.

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

2. Enter the command to run the server in your application's mcp configuration settings.

```bash
  npm-helper-mcp
```

### Option 3: Install from source

```bash
# Clone the repository
git clone https://github.com/pinkpixel-dev/npm-helper-mcp.git
cd npm-helper-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Optionally run/test the server
npm start
```

Configuration:

1. Copy and paste the json configuration into your application's mcp configuration file.

```json
{
    "mcpServers": {
      "npm-helper": {
        "command": "node",
        "args": [
            "/path/to/npm-helper-mcp/dist/index.js"
        ]
      }
    }
  }
```

2. Enter the command to run the server in your application's mcp configuration settings.

```bash
 node /path/to/npm-helper-mcp/dist/index.js
```

## Using with LLMs

This server follows the Model Context Protocol, which allows it to be used by LLMs like Claude. The LLM can use the server's tools to perform various npm operations.

### Available Tools

#### Tool: check_updates

Scans package.json for outdated dependencies.

Parameters:

- `packagePath` (optional): Path to package.json file (default: ./package.json)
- `filter` (optional): List of package names to check
- `reject` (optional): List of package names to exclude
- `target` (optional): Target version to upgrade to (latest, newest, greatest, minor, patch, semver)
- `interactive` (optional): Enable interactive mode for choosing updates
- `peer` (optional): Check peer dependencies of installed packages
- `minimal` (optional): Do not upgrade newer versions that are already satisfied by the version range
- `packageManager` (optional): Package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)

Example:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json",
    "filter": ["react", "lodash"],
    "peer": true,
    "minimal": true,
    "packageManager": "npm"
  }
}
```

#### Tool: upgrade_packages

Upgrades dependencies to their latest versions.

Parameters:

- `packagePath` (optional): Path to package.json file (default: ./package.json)
- `upgradeType` (optional): Target version to upgrade to (latest, newest, greatest, minor, patch, semver)
- `interactive` (optional): Enable interactive mode for choosing updates
- `peer` (optional): Check peer dependencies of installed packages
- `minimal` (optional): Do not upgrade newer versions that are already satisfied by the version range
- `packageManager` (optional): Package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)

Example:

```json
{
  "name": "upgrade_packages",
  "arguments": {
    "upgradeType": "minor",
    "peer": true,
    "minimal": true,
    "packageManager": "yarn"
  }
}
```

#### Tool: filter_updates

Checks updates for specific packages.

Parameters:

- `packagePath` (optional): Path to package.json file (default: ./package.json)
- `filter` (required): List of package names to check
- `upgrade` (optional): Whether to upgrade the package.json file or just check
- `minimal` (optional): Do not upgrade newer versions that are already satisfied by the version range
- `packageManager` (optional): Package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)

Example:

```json
{
  "name": "filter_updates",
  "arguments": {
    "filter": ["react", "react-dom"],
    "upgrade": false,
    "minimal": true
  }
}
```

#### Tool: resolve_conflicts

Handles dependency conflicts using peer dependencies.

Parameters:

- `packagePath` (optional): Path to package.json file (default: ./package.json)
- `upgrade` (optional): Whether to upgrade the package.json file or just check
- `minimal` (optional): Do not upgrade newer versions that are already satisfied by the version range
- `packageManager` (optional): Package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)

Example:

```json
{
  "name": "resolve_conflicts",
  "arguments": {
    "upgrade": true,
    "packageManager": "npm"
  }
}
```

#### Tool: set_version_constraints

Configures version upgrade rules.

Parameters:

- `packagePath` (optional): Path to package.json file (default: ./package.json)
- `target` (required): Target version constraint strategy (latest, newest, greatest, minor, patch, semver)
- `removeRange` (optional): Remove version ranges from the final package version
- `upgrade` (optional): Whether to upgrade the package.json file or just check
- `minimal` (optional): Do not upgrade newer versions that are already satisfied by the version range
- `packageManager` (optional): Package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)

Example:

```json
{
  "name": "set_version_constraints",
  "arguments": {
    "target": "minor",
    "removeRange": false,
    "upgrade": true,
    "packageManager": "pnpm"
  }
}
```

#### Tool: run_doctor

Iteratively installs upgrades and runs tests to identify breaking upgrades. It automatically reverts breaking upgrades and keeps working ones.

Parameters:

- `packagePath` (optional): Path to package.json file (default: ./package.json)
- `doctorInstall` (optional): Custom install script to use (default: 'npm install' or 'yarn')
- `doctorTest` (optional): Custom test script to use (default: 'npm test')
- `packageManager` (optional): Package manager to use (npm, yarn, pnpm, deno, bun, staticRegistry)

Example:

```json
{
  "name": "run_doctor",
  "arguments": {
    "packagePath": "./package.json",
    "doctorInstall": "npm ci",
    "doctorTest": "npm run test:ci",
    "packageManager": "npm"
  }
}
```

#### Tool: search_npm

Searches for npm packages.

Parameters:

- `query` (required): Search query for npm packages
- `maxResults` (optional): Maximum number of results to return (default: 10)

Example:

```json
{
  "name": "search_npm",
  "arguments": {
    "query": "react state management",
    "maxResults": 5
  }
}
```

#### Tool: fetch_package_content

Fetch and parse detailed content from an npm package page.

Parameters:

- `url` (required): URL of the npm package page

Example:

```json
{
  "name": "fetch_package_content",
  "arguments": {
    "url": "https://www.npmjs.com/package/react"
  }
}
```

#### Tool: get_package_versions

Gets available versions for an npm package.

Parameters:

- `packageName` (required): Name of the npm package

Example:

```json
{
  "name": "get_package_versions",
  "arguments": {
    "packageName": "react"
  }
}
```

#### Tool: get_package_details

Gets detailed information about an npm package.

Parameters:

- `packageName` (required): Name of the npm package

Example:

```json
{
  "name": "get_package_details",
  "arguments": {
    "packageName": "react"
  }
}
```

## 📝 Response Format

All tools return responses in a standard format:

```json
{
  "status": "success" | "error",
  "data": {}, // Tool-specific data
  "message": "Human-readable message"
}
```

## 🆘 Troubleshooting

### Connection Issues**:

- Ensure your LLM application is correctly configured to use the Model Context Protocol.
- Check your .json file for any errors, or verify your start command is correct.
- If running locally, verify your path to the index.js file. Use absolute paths if necessary.

### Getting Help

If you encounter any issues not covered here:

- Check the [GitHub issues](https://github.com/pinkpixel-dev/npm-helper-mcp/issues) for similar problems and solutions.
- Create a new issue with a detailed description of your problem.

## 📄 License

MIT

## 🙏 Credits

- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)
- [@modelcontextprotocol/sdk](https://github.com/anthropics/model-context-protocol)

Made with ❤️ by Pink Pixel
