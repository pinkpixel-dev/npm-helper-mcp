#!/usr/bin/env node
/**
 * npm-helper-mcp
 * A Model Context Protocol server for NPM dependency management.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
  ListResourcesRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as ncu from 'npm-check-updates';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { z } from 'zod'; // Import Zod [2][4][6]

// Configure process to ensure all output goes to stderr for MCP compliance
process.env.FORCE_COLOR = '1';

// Create a logger that explicitly logs to stderr only
const logger = {
  debug: (...args: any[]) => process.stderr.write(`[DEBUG] ${args.join(' ')}\n`),
  info: (...args: any[]) => process.stderr.write(`[INFO] ${args.join(' ')}\n`),
  warn: (...args: any[]) => process.stderr.write(`[WARN] ${args.join(' ')}\n`),
  error: (...args: any[]) => process.stderr.write(`[ERROR] ${args.join(' ')}\n`)
};

// --- Zod Schemas for Tool Inputs --- [2][6]
const PackageManagerEnum = z.enum(["npm", "yarn", "pnpm", "deno", "bun", "staticRegistry"]);
const NcuTargetEnum = z.enum(["latest", "newest", "greatest", "minor", "patch", "semver"]);

const SearchNpmSchema = z.object({
  query: z.string(),
  maxResults: z.number().optional().default(10),
});
type SearchNpmArgs = z.infer<typeof SearchNpmSchema>;

const EnhancedSearchNpmSchema = z.object({
  query: z.string(),
  maxResults: z.number().optional().default(10),
});
type EnhancedSearchNpmArgs = z.infer<typeof EnhancedSearchNpmSchema>;

const FetchPackageContentSchema = z.object({
  url: z.string().url(),
});
type FetchPackageContentArgs = z.infer<typeof FetchPackageContentSchema>;

const GetPackageVersionsSchema = z.object({
  packageName: z.string(),
});
type GetPackageVersionsArgs = z.infer<typeof GetPackageVersionsSchema>;

const GetPackageDetailsSchema = z.object({
  packageName: z.string(),
});
type GetPackageDetailsArgs = z.infer<typeof GetPackageDetailsSchema>;

const CheckUpdatesSchema = z.object({
  packagePath: z.string().optional(),
  filter: z.array(z.string()).optional(),
  reject: z.array(z.string()).optional(),
  target: NcuTargetEnum.optional(),
  peer: z.boolean().optional(),
  minimal: z.boolean().optional(),
  packageManager: PackageManagerEnum.optional(),
});
type CheckUpdatesArgs = z.infer<typeof CheckUpdatesSchema>;

const UpgradePackagesSchema = z.object({
  packagePath: z.string().optional(),
  upgradeType: NcuTargetEnum.optional(), // 'target' for ncu
  peer: z.boolean().optional(),
  minimal: z.boolean().optional(),
  packageManager: PackageManagerEnum.optional(),
});
type UpgradePackagesArgs = z.infer<typeof UpgradePackagesSchema>;

const FilterUpdatesSchema = z.object({
  packagePath: z.string().optional(),
  filter: z.array(z.string()).min(1, "Filter criteria must be provided."),
  upgrade: z.boolean().optional(),
  minimal: z.boolean().optional(),
  packageManager: PackageManagerEnum.optional(),
});
type FilterUpdatesArgs = z.infer<typeof FilterUpdatesSchema>;

const ResolveConflictsSchema = z.object({
  packagePath: z.string().optional(),
  upgrade: z.boolean().optional(),
  minimal: z.boolean().optional(),
  packageManager: PackageManagerEnum.optional(),
});
type ResolveConflictsArgs = z.infer<typeof ResolveConflictsSchema>;

const SetVersionConstraintsSchema = z.object({
  packagePath: z.string().optional(),
  target: NcuTargetEnum,
  removeRange: z.boolean().optional(),
  upgrade: z.boolean().optional(),
  minimal: z.boolean().optional(),
  packageManager: PackageManagerEnum.optional(),
});
type SetVersionConstraintsArgs = z.infer<typeof SetVersionConstraintsSchema>;

const RunDoctorSchema = z.object({
  packagePath: z.string().optional(),
  doctorInstall: z.string().optional(),
  doctorTest: z.string().optional(),
  packageManager: PackageManagerEnum.optional(),
});
type RunDoctorArgs = z.infer<typeof RunDoctorSchema>;

// Interfaces (NpcPackageInfo, NpmSearchResult, etc.) remain the same
// These are primarily for the structure of data returned by NpmSearcher.
interface NpmPackageInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  lastPublish?: string;
  weeklyDownloads?: string;
}

interface NpmSearchResult {
  packages: NpmPackageInfo[];
  totalResults: number;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

class RateLimiter { /* ... (same as before) ... */
  private rateLimit: number;
  private queue: Array<() => void> = [];
  private lastRequestTime: number = 0;

  constructor(requestsPerSecond: number = 2) {
    this.rateLimit = 1000 / requestsPerSecond;
  }

  async acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest >= this.rateLimit) {
      this.lastRequestTime = now;
      const next = this.queue.shift();
      if (next) next();
    } else {
      setTimeout(() => this.processQueue(), this.rateLimit - timeSinceLastRequest);
    }
  }
}

class NpmSearcher { /* ... (same as before, method signatures might need slight adjustment if Zod types are used internally) ... */
  private static readonly REGISTRY_URL = "https://registry.npmjs.org";
  private static readonly WEBSITE_URL = "https://www.npmjs.com";
  private static readonly DDG_URL = "https://html.duckduckgo.com/html";
  private static readonly HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  };
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter(2);
  }

  async searchPackages(args: SearchNpmArgs): Promise<NpmSearchResult> {
    const { query, maxResults } = args;
    try {
      await this.rateLimiter.acquire();
      const searchUrl = `${NpmSearcher.REGISTRY_URL}/-/v1/search?text=${encodeURIComponent(query)}&size=${maxResults}`;
      const response = await fetch(searchUrl, { headers: NpmSearcher.HEADERS });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const packages: NpmPackageInfo[] = data.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description,
        author: obj.package.author?.name,
        homepage: obj.package.links?.homepage,
        repository: obj.package.links?.repository,
        keywords: obj.package.keywords || [],
        weeklyDownloads: obj.score?.detail?.maintenance?.toString(),
        lastPublish: new Date(obj.package.date).toLocaleDateString()
      }));
      return { packages, totalResults: data.total };
    } catch (error) {
      throw new Error(`Error searching npm packages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async enhancedSearch(args: EnhancedSearchNpmArgs): Promise<SearchResult[]> {
     const { query, maxResults } = args;
    const enhancedQuery = `${query} site:npmjs.com`;
    try {
      await this.rateLimiter.acquire();
      logger.info(`Searching DuckDuckGo for: ${enhancedQuery}`);
      const formData = new URLSearchParams({ q: enhancedQuery, b: "", kl: "" });
      const response = await fetch(NpmSearcher.DDG_URL, {
        method: 'POST',
        headers: { ...NpmSearcher.HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const html = await response.text();
      const $ = cheerio.load(html);
      if (!$) { logger.error("Failed to parse HTML response"); return []; }
      const results: SearchResult[] = [];
      $('.result').each((index, element) => {
        if (results.length >= maxResults) return false;
        const titleElem = $(element).find('.result__title a');
        if (!titleElem.length) return true;
        const title = titleElem.text().trim();
        let link = titleElem.attr('href') || "";
        if (link.includes('y.js')) return true; // Skip ads
        if (link.startsWith('//duckduckgo.com/l/?uddg=')) {
          try { link = decodeURIComponent(link.split('uddg=')[1].split('&')[0]); } catch (e) { /* use original */ }
        }
        const snippet = $(element).find('.result__snippet').text().trim() || "";
        results.push({ title, link, snippet, position: results.length + 1 });
      });
      logger.info(`Successfully found ${results.length} results`);
      return results;
    } catch (error) {
      logger.error(`Error during enhanced search: ${error instanceof Error ? error.message : String(error)}`);
      throw error; // Propagate error
    }
  }

  async fetchPackageContent(args: FetchPackageContentArgs): Promise<string> {
    const { url } = args;
    try {
      await this.rateLimiter.acquire();
      logger.info(`Fetching content from: ${url}`);
      const response = await fetch(url, { headers: NpmSearcher.HEADERS, redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const html = await response.text();
      const $ = cheerio.load(html);
      $('script, style, nav, header, footer').remove();
      let content = "";
      const packageName = $('#top h1').text().trim();
      const packageVersion = $('[data-testid="version-badge"]').text().trim();
      const description = $('#package-description').text().trim();
      let readme = $('#readme').text().trim();
      if (packageName) content += `Package: ${packageName}\n`;
      if (packageVersion) content += `Version: ${packageVersion}\n`;
      if (description) content += `Description: ${description}\n\n`;
      if (readme) {
        content += `README:\n${readme.length > 4000 ? readme.substring(0, 4000) + '...\n[README content truncated]' : readme}`;
      }
      return content || "No extractable content found.";
    } catch (error) {
      throw new Error(`Error fetching package content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPackageVersions(args: GetPackageVersionsArgs): Promise<string[]> {
    const { packageName } = args;
    try {
      const response = await fetch(`${NpmSearcher.REGISTRY_URL}/${packageName}`, { headers: NpmSearcher.HEADERS });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      return Object.keys(data.versions).reverse();
    } catch (error) {
      throw new Error(`Error fetching package versions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPackageDetails(args: GetPackageDetailsArgs): Promise<any> {
    const { packageName } = args;
    try {
      const response = await fetch(`${NpmSearcher.REGISTRY_URL}/${packageName}`, { headers: NpmSearcher.HEADERS });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error(`Error fetching package details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  formatSearchResults(results: NpmSearchResult): string { /* ... (same as before) ... */
    if (!results.packages.length) return "No packages found.";
    let output = `Found ${results.totalResults} packages (showing ${results.packages.length}):\n\n`;
    results.packages.forEach(pkg => {
      output += `📦 ${pkg.name}@${pkg.version}\n`;
      if (pkg.description) output += `   Description: ${pkg.description}\n`;
      if (pkg.author) output += `   Author: ${pkg.author}\n`;
      output += '\n';
    });
    return output;
  }
  formatEnhancedSearchResults(results: SearchResult[]): string { /* ... (same as before) ... */
    if (!results.length) return "No packages found.";
    let output = `Found ${results.length} NPM packages:\n\n`;
    results.forEach(result => {
      output += `📦 ${result.title}\n`;
      if (result.snippet) output += `   Description: ${result.snippet}\n`;
      output += `   URL: ${result.link}\n\n`;
    });
    return output;
  }
  formatVersions(packageName: string, versions: string[]): string { /* ... (same as before) ... */
    if (!versions.length) return `No versions found for ${packageName}.`;
    let output = `📦 ${packageName}\nAvailable versions (newest first):\n`;
    output += versions.slice(0, 15).join(', ');
    if (versions.length > 15) output += `\n...and ${versions.length - 15} more versions`;
    return output;
  }
}


class NpmCheckUpdatesHandler {
  private resolvePackagePath(packagePath?: string): string { /* ... (same as before) ... */
    const resolvedPath = path.resolve(process.cwd(), packagePath || 'package.json');
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Package file not found: ${resolvedPath}`);
    }
    return resolvedPath;
  }

  private async runNcu(baseOptions: any): Promise<any> { /* ... (same as before) ... */
    const ncuOptions = {
      ...baseOptions,
      jsonUpgraded: true,
      silent: true,
      stdout: process.stderr,
      stderr: process.stderr,
      loglevel: 'silent',
      json: true,
    };
    logger.debug(`Running ncu with options: ${JSON.stringify(ncuOptions)}`);
    try {
      return await ncu.run(ncuOptions) || {};
    } catch (error) {
        // ncu might throw errors for various reasons (e.g., no package file)
        // We want to propagate this as an error message.
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`NCU execution error: ${errorMessage}`);
        throw new Error(`NCU execution failed: ${errorMessage}`);
    }
  }

  // Methods now accept Zod-inferred types and throw errors on failure
  async checkUpdates(options: CheckUpdatesArgs): Promise<{ data: any; message: string }> {
    const packageFile = this.resolvePackagePath(options.packagePath);
    const ncuBaseOptions: any = { packageFile };
    if (options.filter) ncuBaseOptions.filter = options.filter;
    if (options.reject) ncuBaseOptions.reject = options.reject;
    if (options.target) ncuBaseOptions.target = options.target;
    if (options.peer) ncuBaseOptions.peer = true;
    if (options.minimal) ncuBaseOptions.minimal = true;
    if (options.packageManager) ncuBaseOptions.packageManager = options.packageManager;
    
    const result = await this.runNcu(ncuBaseOptions);
    const numUpdates = Object.keys(result).length;
    return {
      data: result,
      message: numUpdates > 0 ? `Found ${numUpdates} outdated dependencies.` : "All dependencies are up-to-date."
    };
  }

  async upgradePackages(options: UpgradePackagesArgs): Promise<{ data: any; message: string }> {
    const packageFile = this.resolvePackagePath(options.packagePath);
    const ncuBaseOptions: any = { packageFile, upgrade: true };
    if (options.upgradeType) ncuBaseOptions.target = options.upgradeType;
    // ncu's interactive mode is not compatible with MCP stdio, so it's omitted.
    if (options.peer) ncuBaseOptions.peer = true;
    if (options.minimal) ncuBaseOptions.minimal = true;
    if (options.packageManager) ncuBaseOptions.packageManager = options.packageManager;
    
    const result = await this.runNcu(ncuBaseOptions);
    const numUpgraded = Object.keys(result).length;
    return {
      data: result,
      message: numUpgraded > 0 ? `Upgraded ${numUpgraded} dependencies.` : "No dependencies needed upgrading or were upgraded."
    };
  }

  async filterUpdates(options: FilterUpdatesArgs): Promise<{ data: any; message: string }> {
    const packageFile = this.resolvePackagePath(options.packagePath);
    const ncuBaseOptions: any = { packageFile, filter: options.filter };
    if (options.upgrade) ncuBaseOptions.upgrade = true;
    if (options.minimal) ncuBaseOptions.minimal = true;
    if (options.packageManager) ncuBaseOptions.packageManager = options.packageManager;

    const result = await this.runNcu(ncuBaseOptions);
    const numFound = Object.keys(result).length;
    return {
      data: result,
      message: numFound > 0 
        ? `Found ${numFound} filtered dependencies ${options.upgrade ? 'and upgraded them.' : 'with available updates.'}` 
        : "No updates found for the filtered dependencies."
    };
  }

  async resolveConflicts(options: ResolveConflictsArgs): Promise<{ data: any; message: string }> {
    const packageFile = this.resolvePackagePath(options.packagePath);
    const ncuBaseOptions: any = { packageFile, peer: true };
    if (options.upgrade) ncuBaseOptions.upgrade = true;
    if (options.minimal) ncuBaseOptions.minimal = true;
    if (options.packageManager) ncuBaseOptions.packageManager = options.packageManager;

    const result = await this.runNcu(ncuBaseOptions);
    const numResolved = Object.keys(result).length;
    return {
      data: result,
      message: numResolved > 0 
        ? `Attempted to resolve conflicts for ${numResolved} dependencies using the 'peer' strategy ${options.upgrade ? 'and applied changes.' : '.'}`
        : "No conflicts found or resolved based on peer strategy."
    };
  }

  async setVersionConstraints(options: SetVersionConstraintsArgs): Promise<{ data: any; message: string }> {
    const packageFile = this.resolvePackagePath(options.packagePath);
    const ncuBaseOptions: any = { packageFile, target: options.target };
    if (options.removeRange) ncuBaseOptions.removeRange = true;
    if (options.upgrade) ncuBaseOptions.upgrade = true;
    if (options.minimal) ncuBaseOptions.minimal = true;
    if (options.packageManager) ncuBaseOptions.packageManager = options.packageManager;
    
    const result = await this.runNcu(ncuBaseOptions);
    const numChanged = Object.keys(result).length;
    return {
      data: result,
      message: numChanged > 0 
        ? `Applied version constraints to ${numChanged} dependencies ${options.upgrade ? 'and updated package.json.' : ' (dry run).'}`
        : "No dependencies required changes based on the version constraints."
    };
  }

  async runDoctor(options: RunDoctorArgs): Promise<{ data: any; message: string }> {
    const packageFile = this.resolvePackagePath(options.packagePath);
    const ncuBaseOptions: any = { packageFile, doctor: true, upgrade: true };
    if (options.doctorInstall) ncuBaseOptions.doctorInstall = options.doctorInstall;
    if (options.doctorTest) ncuBaseOptions.doctorTest = options.doctorTest;
    if (options.packageManager) ncuBaseOptions.packageManager = options.packageManager;
    
    const result = await this.runNcu(ncuBaseOptions);
    if (typeof result === 'object' && Object.keys(result).length === 0) {
      return {
        data: {},
        message: "Doctor mode completed. No breaking upgrades found or all dependencies are up-to-date."
      };
    }
    let workingUpgrades = 0;
    let brokenUpgrades = 0;
    if (typeof result === 'object' && result !== null) {
      for (const outcome of Object.values(result)) {
        if (outcome === true) workingUpgrades++; else brokenUpgrades++;
      }
    }
    return {
      data: result,
      message: `Doctor mode completed: ${workingUpgrades} working upgrades applied, ${brokenUpgrades} breaking upgrades identified.`
    };
  }
}

// Main entrypoint code at the bottom of the file - Replace with this
const server = new Server(
  {
    name: "npm-helper-mcp",
    version: "2.0.3",
  },
  {
    capabilities: {
      tools: {}, // Will be populated by our handlers
      resources: {}, // Enable resources capability
    },
  }
);

// Create an instance of our handlers
const npmSearcher = new NpmSearcher();
const ncuHandler = new NpmCheckUpdatesHandler();

// Setup error handlers
server.onerror = (error) => {
  logger.error(`[MCP Server Error] ${error instanceof Error ? error.message : String(error)}`);
};

process.on('SIGINT', async () => {
  logger.info(`Received SIGINT, shutting down server...`);
  await server.close();
  process.exit(0);
});

// Register our tool handlers
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
    return {
      tools: [
        { name: "search_npm", description: "Search for npm packages", inputSchema: { type: "object", properties: { query: { type: "string" }, maxResults: { type: "number", default: 10 } }, required: ["query"] }},
        { name: "enhanced_search_npm", description: "Enhanced search for npm packages using natural language", inputSchema: { type: "object", properties: { query: { type: "string" }, maxResults: { type: "number", default: 10 } }, required: ["query"] }},
        { name: "fetch_package_content", description: "Fetch detailed content from an npm package page URL", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }},
        { name: "get_package_versions", description: "Get available versions for an npm package", inputSchema: { type: "object", properties: { packageName: { type: "string" } }, required: ["packageName"] }},
        { name: "get_package_details", description: "Get detailed information about an npm package", inputSchema: { type: "object", properties: { packageName: { type: "string" } }, required: ["packageName"] }},
        { name: "check_updates", description: "Scan package.json for outdated dependencies", inputSchema: { type: "object", properties: { packagePath: { type: "string" }, filter: { type: "array", items: { type: "string" }}, reject: { type: "array", items: { type: "string" }}, target: { type: "string", enum: NcuTargetEnum.options }, peer: { type: "boolean" }, minimal: { type: "boolean" }, packageManager: { type: "string", enum: PackageManagerEnum.options } }}},
        { name: "upgrade_packages", description: "Upgrade dependencies in package.json", inputSchema: { type: "object", properties: { packagePath: { type: "string" }, upgradeType: { type: "string", enum: NcuTargetEnum.options }, peer: { type: "boolean" }, minimal: { type: "boolean" }, packageManager: { type: "string", enum: PackageManagerEnum.options } }}},
        { name: "filter_updates", description: "Check/upgrade updates for specific packages", inputSchema: { type: "object", properties: { packagePath: { type: "string" }, filter: { type: "array", items: { type: "string" }}, upgrade: { type: "boolean" }, minimal: { type: "boolean" }, packageManager: { type: "string", enum: PackageManagerEnum.options } }, required: ["filter"] }},
        { name: "resolve_conflicts", description: "Handle dependency conflicts (uses 'peer' strategy)", inputSchema: { type: "object", properties: { packagePath: { type: "string" }, upgrade: { type: "boolean" }, minimal: { type: "boolean" }, packageManager: { type: "string", enum: PackageManagerEnum.options } }}},
        { name: "set_version_constraints", description: "Configure version upgrade rules for dependencies", inputSchema: { type: "object", properties: { packagePath: { type: "string" }, target: { type: "string", enum: NcuTargetEnum.options }, removeRange: { type: "boolean" }, upgrade: { type: "boolean" }, minimal: { type: "boolean" }, packageManager: { type: "string", enum: PackageManagerEnum.options } }, required: ["target"] }},
        { name: "run_doctor", description: "Iteratively install upgrades and run tests", inputSchema: { type: "object", properties: { packagePath: { type: "string" }, doctorInstall: { type: "string" }, doctorTest: { type: "string" }, packageManager: { type: "string", enum: PackageManagerEnum.options } }}}
      ]
    };
  }
);

server.setRequestHandler(
  ListResourcesRequestSchema,
  async () => ({
    offerings: { 
      resources: [], 
      tools: [
        { name: "search_npm", description: "Search for npm packages", inputSchema: { type: "object", properties: { query: { type: "string" }, maxResults: { type: "number", default: 10 } }, required: ["query"] }},
        // ... same as above ...
      ] 
    }
  })
);

server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    const { name, arguments: args } = request.params;
    let parsedArgs: any; // To hold Zod parsed data

    try {
      switch (name) {
        case "search_npm": {
          parsedArgs = SearchNpmSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const results = await npmSearcher.searchPackages(parsedArgs.data);
          return { content: [{ type: "text", text: npmSearcher.formatSearchResults(results) }] };
        }
        case "enhanced_search_npm": {
          parsedArgs = EnhancedSearchNpmSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const results = await npmSearcher.enhancedSearch(parsedArgs.data);
          return { content: [{ type: "text", text: npmSearcher.formatEnhancedSearchResults(results) }] };
        }
        case "fetch_package_content": {
          parsedArgs = FetchPackageContentSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const content = await npmSearcher.fetchPackageContent(parsedArgs.data);
          return { content: [{ type: "text", text: content }] };
        }
        case "get_package_versions": {
          parsedArgs = GetPackageVersionsSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const versions = await npmSearcher.getPackageVersions(parsedArgs.data);
          return { content: [{ type: "text", text: npmSearcher.formatVersions(parsedArgs.data.packageName, versions) }] };
        }
        case "get_package_details": {
          parsedArgs = GetPackageDetailsSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const details = await npmSearcher.getPackageDetails(parsedArgs.data);
          return { content: [{ type: "text", text: JSON.stringify(details, null, 2) }] };
        }

        // npm-check-updates tools
        case "check_updates":
          parsedArgs = CheckUpdatesSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const checkResult = await ncuHandler.checkUpdates(parsedArgs.data);
          return { content: [{ type: "text", text: `${checkResult.message}\n\n${JSON.stringify(checkResult.data, null, 2)}` }] };
        
        case "upgrade_packages":
          parsedArgs = UpgradePackagesSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const upgradeResult = await ncuHandler.upgradePackages(parsedArgs.data);
          return { content: [{ type: "text", text: `${upgradeResult.message}\n\n${JSON.stringify(upgradeResult.data, null, 2)}` }] };

        case "filter_updates":
          parsedArgs = FilterUpdatesSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const filterResult = await ncuHandler.filterUpdates(parsedArgs.data);
          return { content: [{ type: "text", text: `${filterResult.message}\n\n${JSON.stringify(filterResult.data, null, 2)}` }] };

        case "resolve_conflicts":
          parsedArgs = ResolveConflictsSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const resolveResult = await ncuHandler.resolveConflicts({ ...parsedArgs.data, peer: true }); // 'peer' is implicit
          return { content: [{ type: "text", text: `${resolveResult.message}\n\n${JSON.stringify(resolveResult.data, null, 2)}` }] };

        case "set_version_constraints":
          parsedArgs = SetVersionConstraintsSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const setResult = await ncuHandler.setVersionConstraints(parsedArgs.data);
          return { content: [{ type: "text", text: `${setResult.message}\n\n${JSON.stringify(setResult.data, null, 2)}` }] };

        case "run_doctor":
          parsedArgs = RunDoctorSchema.safeParse(args);
          if (!parsedArgs.success) throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${parsedArgs.error.format()}`);
          const doctorResult = await ncuHandler.runDoctor(parsedArgs.data);
          return { content: [{ type: "text", text: `${doctorResult.message}\n\n${JSON.stringify(doctorResult.data, null, 2)}` }] };
          
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      process.stderr.write(`[ERROR] Tool error (${name}): ${error instanceof Error ? error.message : String(error)}\n`);
      if (error instanceof McpError) {
        // For McpErrors (like validation errors), re-throw to let SDK handle standard formatting.
        throw error;
      }
      // For other unexpected errors, craft a generic MCP error response.
      return {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        isError: true // Indicate this is an error response as per MCP spec
      };
    }
  }
);

// Launch the server
async function runServer() {
  try {
    // CRITICAL: Only write to stderr, never stdout which must be kept clean for MCP
    logger.info("NPM Helper MCP Server starting up...");
    
    // Connect to the transport BEFORE logging any startup messages
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Continue with post-connect logging to stderr only
    logger.info("NPM Helper MCP Server connected and listening for requests");
  } catch (error) {
    logger.error(`Fatal error starting server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Start the server without any additional logging to stdout
runServer().catch((error) => {
  logger.error(`Fatal error running server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
