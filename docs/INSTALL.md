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

   ```

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

## 🆘 Troubleshooting

### Connection Issues**:

- Ensure your LLM application is correctly configured to use the Model Context Protocol.
- Check your .json file for any errors, or verify your start command is correct.
- If running locally, verify your path to the index.js file. Use absolute paths if necessary.

### Getting Help

If you encounter any issues not covered here:

- Check the [GitHub issues](https://github.com/pinkpixel-dev/npm-helper-mcp/issues) for similar problems and solutions.
- Create a new issue with a detailed description of your problem.
