# 📚 npm-helper-mcp Usage Examples

This document provides practical examples for using the npm-helper-mcp tools to manage npm dependencies and search for packages.

## 🔍 NPM Search Examples

### Basic Package Search

To search for React-related packages:

```json
{
  "name": "search_npm",
  "arguments": {
    "query": "react",
    "maxResults": 5
  }
}
```

### Fetch Detailed Package Content

To fetch and parse detailed content from a package page:

```json
{
  "name": "fetch_package_content",
  "arguments": {
    "url": "https://www.npmjs.com/package/react-query"
  }
}
```

### Search for Specific Features

To find packages related to state management:

```json
{
  "name": "search_npm",
  "arguments": {
    "query": "state management react",
    "maxResults": 10
  }
}
```

### Get Package Version History

To see all available versions of a package:

```json
{
  "name": "get_package_versions",
  "arguments": {
    "packageName": "express"
  }
}
```

### Get Detailed Package Information

To retrieve complete metadata for a package:

```json
{
  "name": "get_package_details",
  "arguments": {
    "packageName": "lodash"
  }
}
```

## 🔄 Dependency Management Examples

### Check for Outdated Dependencies

To scan your project for outdated dependencies:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json"
  }
}
```

### Check Only Specific Packages

To check if only certain packages need updates:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json",
    "filter": ["react", "react-dom", "@types/react"]
  }
}
```

### Check for Updates While Respecting Semver Ranges

To check for updates but don't suggest versions already satisfied by the version range:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json",
    "minimal": true
  }
}
```

### Exclude Certain Packages from Updates

To check for updates but exclude specific packages:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json",
    "reject": ["typescript", "eslint"]
  }
}
```

### Check for Minor Version Updates Only

To scan for minor version updates only:

```json
{
  "name": "check_updates",
  "arguments": {
    "packagePath": "./package.json",
    "target": "minor"
  }
}
```

### Upgrade All Dependencies

To upgrade all dependencies to their latest versions:

```json
{
  "name": "upgrade_packages",
  "arguments": {
    "packagePath": "./package.json",
    "upgradeType": "latest"
  }
}
```

### Upgrade to Minor Versions Only

To upgrade dependencies but limit to minor version changes:

```json
{
  "name": "upgrade_packages",
  "arguments": {
    "packagePath": "./package.json",
    "upgradeType": "minor"
  }
}
```

### Upgrade with Peer Dependency Handling

To upgrade dependencies and automatically handle peer dependencies:

```json
{
  "name": "upgrade_packages",
  "arguments": {
    "packagePath": "./package.json",
    "upgradeType": "latest",
    "peer": true
  }
}
```

### Use a Specific Package Manager

To upgrade dependencies using a specific package manager:

```json
{
  "name": "upgrade_packages",
  "arguments": {
    "packagePath": "./package.json",
    "upgradeType": "latest",
    "packageManager": "yarn"
  }
}
```

### Filter and Upgrade Specific Packages

To upgrade only React-related packages:

```json
{
  "name": "filter_updates",
  "arguments": {
    "packagePath": "./package.json",
    "filter": ["react", "react-dom", "react-router", "@types/react"],
    "upgrade": true
  }
}
```

### Resolve Dependency Conflicts

To resolve dependency conflicts using peer dependencies:

```json
{
  "name": "resolve_conflicts",
  "arguments": {
    "packagePath": "./package.json",
    "upgrade": true
  }
}
```

### Set Version Constraints

To set a version constraint strategy for your dependencies:

```json
{
  "name": "set_version_constraints",
  "arguments": {
    "packagePath": "./package.json",
    "target": "minor",
    "upgrade": true
  }
}
```

### Remove Version Ranges

To remove version ranges from your dependencies:

```json
{
  "name": "set_version_constraints",
  "arguments": {
    "packagePath": "./package.json",
    "target": "latest",
    "removeRange": true,
    "upgrade": true
  }
}
```

### Run Doctor to Safely Upgrade Dependencies

To safely upgrade dependencies by testing each upgrade:

```json
{
  "name": "run_doctor",
  "arguments": {
    "packagePath": "./package.json"
  }
}
```

### Run Doctor with Custom Test Script

To use a custom test script when checking for breaking upgrades:

```json
{
  "name": "run_doctor",
  "arguments": {
    "packagePath": "./package.json",
    "doctorTest": "npm run test:ci",
    "doctorInstall": "npm ci"
  }
}
```

### Run Doctor with Specific Package Manager

To run the doctor tool with a specific package manager:

```json
{
  "name": "run_doctor",
  "arguments": {
    "packagePath": "./package.json",
    "packageManager": "pnpm"
  }
}
```

## 🌟 Common Workflows

### Monthly Dependency Update

A common workflow for monthly maintenance:

1. Check which packages have updates:
   ```json
   {
     "name": "check_updates",
     "arguments": {
       "packagePath": "./package.json"
     }
   }
   ```

2. Upgrade non-breaking changes:
   ```json
   {
     "name": "upgrade_packages",
     "arguments": {
       "packagePath": "./package.json",
       "upgradeType": "minor",
       "peer": true
     }
   }
   ```

3. Test your application to ensure it works with the updated dependencies.

### Safe Dependency Update with Doctor

A workflow for safely updating dependencies:

1. Check for available updates:
   ```json
   {
     "name": "check_updates",
     "arguments": {
       "packagePath": "./package.json"
     }
   }
   ```

2. Run the doctor to automatically test and apply working upgrades:
   ```json
   {
     "name": "run_doctor",
     "arguments": {
       "packagePath": "./package.json",
       "doctorTest": "npm test"
     }
   }
   ```

3. Review the results to see which upgrades worked and which ones were reverted.

### Finding and Upgrading Specific Types of Packages

1. Search for packages related to your needs:
   ```json
   {
     "name": "search_npm",
     "arguments": {
       "query": "react testing library",
       "maxResults": 10
     }
   }
   ```

2. Get details for a specific package:
   ```json
   {
     "name": "get_package_details",
     "arguments": {
       "packageName": "@testing-library/react"
     }
   }
   ```

3. Check and upgrade only testing-related packages:
   ```json
   {
     "name": "filter_updates",
     "arguments": {
       "packagePath": "./package.json",
       "filter": ["jest", "@testing-library/react", "@testing-library/user-event"],
       "upgrade": true
     }
   }
   ``` 