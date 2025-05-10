# 🔧 Tools Overview

----

The `npm-helper-mcp` server provides the following tools:

## 🔍 NPM Search Tools

### `search_npm`

Search for packages in the npm registry.

**Input Parameters:**

- `query`: (string, required) - Search query for npm packages
- `maxResults`: (number, optional) - Maximum number of results to return (default: 10, max: 20)

**Example:**

```json
{
  "query": "react state management",
  "maxResults": 5
}
```

**Output:**
A formatted text response containing matching packages with details like:

- Package name and version
- Description
- Author
- Weekly download count
- Last publish date
- Keywords
- Homepage URL

### `fetch_package_content`

Fetch and parse detailed content from an npm package page.

**Input Parameters:**

- `url`: (string, required) - URL of the npm package page

**Example:**

```json
{
  "url": "https://www.npmjs.com/package/react"
}
```

**Output:**
A text response containing extracted content from the package page including:

- Package name
- Version
- Description
- README content (truncated if too long)

### `get_package_versions`

Retrieve version history for a specific npm package.

**Input Parameters:**

- `packageName`: (string, required) - Name of the npm package

**Example:**

```json
{
  "packageName": "react"
}
```

**Output:**
A formatted text response listing available versions for the package (newest first).

### `get_package_details`

Fetch detailed metadata for a specific npm package.

**Input Parameters:**

- `packageName`: (string, required) - Name of the npm package

**Example:**

```json
{
  "packageName": "express"
}
```

**Output:**
A JSON response containing the full package metadata from the npm registry.

----

## 🚀 Package Updating Tools

### `check_updates`

Scan package.json for outdated dependencies without making changes.

**Input Parameters:**

- `packagePath`: (string, optional) - Path to package.json file (default: ./package.json)
- `filter`: (string[], optional) - List of package names to check
- `reject`: (string[], optional) - List of package names to exclude
- `target`: (enum, optional) - Target version to upgrade to: "latest", "newest", "greatest", "minor", "patch", or "semver"
- `interactive`: (boolean, optional) - Enable interactive mode
- `peer`: (boolean, optional) - Check peer dependencies
- `minimal`: (boolean, optional) - Do not upgrade newer versions that are already satisfied by the version range
- `packageManager`: (enum, optional) - Package manager to use: "npm", "yarn", "pnpm", "deno", "bun", or "staticRegistry"

**Example:**

```json
{
  "packagePath": "./package.json",
  "filter": ["react", "lodash"],
  "target": "minor",
  "minimal": true,
  "packageManager": "npm"
}
```

**Output:**
A JSON response with status, data (outdated packages and their versions), and a message summarizing the results.

### `upgrade_packages`

Upgrade dependencies to latest versions by updating package.json.

**Input Parameters:**

- `packagePath`: (string, optional) - Path to package.json file (default: ./package.json)
- `upgradeType`: (enum, optional) - Target version to upgrade to: "latest", "newest", "greatest", "minor", "patch", or "semver"
- `interactive`: (boolean, optional) - Enable interactive mode
- `peer`: (boolean, optional) - Check peer dependencies
- `minimal`: (boolean, optional) - Do not upgrade newer versions that are already satisfied by the version range
- `packageManager`: (enum, optional) - Package manager to use: "npm", "yarn", "pnpm", "deno", "bun", or "staticRegistry"

**Example:**

```json
{
  "packagePath": "./package.json",
  "upgradeType": "minor",
  "peer": true,
  "minimal": true,
  "packageManager": "yarn"
}
```

**Output:**
A JSON response with status, data (upgraded packages and their versions), and a message summarizing the upgrade results.

### `filter_updates`

Check or apply updates for specific packages only.

**Input Parameters:**

- `packagePath`: (string, optional) - Path to package.json file (default: ./package.json)
- `filter`: (string[], required) - List of package names to check
- `upgrade`: (boolean, optional) - Whether to upgrade the package.json file (default: false)
- `minimal`: (boolean, optional) - Do not upgrade newer versions that are already satisfied by the version range
- `packageManager`: (enum, optional) - Package manager to use: "npm", "yarn", "pnpm", "deno", "bun", or "staticRegistry"

**Example:**

```json
{
  "packagePath": "./package.json",
  "filter": ["react", "react-dom"],
  "upgrade": true,
  "minimal": true
}
```

**Output:**
A JSON response with status, data (filtered packages with updates), and a message summarizing the results.

### `resolve_conflicts`

Handle dependency conflicts using peer dependencies.

**Input Parameters:**

- `packagePath`: (string, optional) - Path to package.json file (default: ./package.json)
- `upgrade`: (boolean, optional) - Whether to upgrade the package.json file (default: false)
- `minimal`: (boolean, optional) - Do not upgrade newer versions that are already satisfied by the version range
- `packageManager`: (enum, optional) - Package manager to use: "npm", "yarn", "pnpm", "deno", "bun", or "staticRegistry"

**Example:**

```json
{
  "packagePath": "./package.json",
  "upgrade": true,
  "packageManager": "npm" 
}
```

**Output:**
A JSON response with status, data (resolved conflicts), and a message summarizing the results.

### `set_version_constraints`

Configure version upgrade rules and constraints.

**Input Parameters:**

- `packagePath`: (string, optional) - Path to package.json file (default: ./package.json)
- `target`: (enum, required) - Target version constraint strategy: "latest", "newest", "greatest", "minor", "patch", or "semver"
- `removeRange`: (boolean, optional) - Remove version ranges from the final package version
- `upgrade`: (boolean, optional) - Whether to upgrade the package.json file (default: false)
- `minimal`: (boolean, optional) - Do not upgrade newer versions that are already satisfied by the version range
- `packageManager`: (enum, optional) - Package manager to use: "npm", "yarn", "pnpm", "deno", "bun", or "staticRegistry"

**Example:**

```json
{
  "packagePath": "./package.json",
  "target": "minor",
  "removeRange": true,
  "upgrade": true,
  "packageManager": "pnpm"
}
```

**Output:**
A JSON response with status, data (packages with applied constraints), and a message summarizing the results.

### `run_doctor`

Iteratively installs upgrades and runs tests to identify breaking upgrades. Reverts broken upgrades and keeps working ones.

**Input Parameters:**

- `packagePath`: (string, optional) - Path to package.json file (default: ./package.json)
- `doctorInstall`: (string, optional) - Custom install script to use (default: 'npm install' or 'yarn')
- `doctorTest`: (string, optional) - Custom test script to use (default: 'npm test')
- `packageManager`: (enum, optional) - Package manager to use: "npm", "yarn", "pnpm", "deno", "bun", or "staticRegistry"

**Example:**

```json
{
  "packagePath": "./package.json",
  "doctorInstall": "npm ci",
  "doctorTest": "npm run test:ci",
  "packageManager": "npm"
}
```

**Output:**
A JSON response with status, data (for each dependency, true if the upgrade worked and false if it failed), and a message summarizing the results including counts of working and breaking upgrades.

## 📝 Response Format

All tools return responses in the following format:

```json
{
  "status": "success" | "error",
  "data": {}, // Tool-specific result data
  "message": "Human-readable message about the operation result"
}
```

For successful operations, `status` will be "success" and `data` will contain the relevant output.
For failed operations, `status` will be "error" and `message` will contain details about what went wrong.

## ⚠️ Error Handling

Common errors that might occur include:

- Package file not found
- Invalid package paths
- Network issues when accessing the npm registry
- Invalid parameters (e.g., missing required fields)

The server returns appropriate error messages in these cases.

## 🔄 Examples

### Check for outdated dependencies:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json",
    "minimal": true
  }
}
```

### Upgrade minor versions with peer dependencies:

```json
{
  "name": "upgrade_packages",
  "arguments": {
    "packagePath": "./package.json",
    "upgradeType": "minor",
    "peer": true,
    "packageManager": "yarn"
  }
}
```

### Search for state management libraries:

```json
{
  "name": "search_npm",
  "arguments": {
    "query": "state management",
    "maxResults": 5
  }
}
```

### Run the doctor to safely upgrade dependencies:

```json
{
  "name": "run_doctor",
  "arguments": {
    "packagePath": "./package.json",
    "packageManager": "npm"
  }
}
```
