#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ quiet: true });

const JsonObject = z.record(z.string(), z.unknown());
const OptionalJsonObject = JsonObject.optional();
const DataType = z.enum(["string", "number", "boolean", "array", "markdown"]);
const SortOrder = z.enum(["asc", "desc"]);
const KeySort = z.enum(["name", "created_at", "updated_at"]);
const TranslationSort = z.enum(["key_name", "created_at", "updated_at"]);
const ProjectSort = z.enum(["name_asc", "name_desc", "updated_at_asc", "updated_at_desc", "space_asc", "space_desc"]);
const LocaleSort = z.enum(["name_asc", "name_desc", "default_asc", "default_desc"]);
const PluralSuffix = z.enum(["zero", "one", "two", "few", "many", "other"]);

type HttpMethod = "GET" | "POST" | "PATCH";
type Query = Record<string, string | number | boolean | string[] | undefined>;

type Config = {
  baseUrl: string;
  token: string;
  platformTokenEndpoint: string;
  defaultProjectId?: string;
  defaultBranch?: string;
  otp?: string;
  timeoutMs: number;
};

class McpToolError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "McpToolError";
  }
}

class PhraseClient {
  private platformJwt?: string;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly platformTokenEndpoint: string,
    private readonly timeoutMs: number,
    private readonly otp?: string,
  ) {}

  async request<T = unknown>(
    method: HttpMethod,
    route: string,
    options: { query?: Query; body?: unknown } = {},
  ): Promise<T> {
    const url = new URL(route.replace(/^\/+/, ""), `${this.baseUrl}/`);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, item);
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const requestBody = options.body === undefined ? undefined : JSON.stringify(options.body);

    try {
      let response = await this.fetchWithAuth(url, method, requestBody, controller.signal, "strings-token");
      if (response.status === 401) {
        response = await this.fetchWithAuth(url, method, requestBody, controller.signal, "platform-jwt");
      }

      const text = await response.text();
      const body = parseResponseBody(text);

      if (!response.ok) {
        const otpRequired = response.headers.get("X-PhraseApp-OTP");
        throw new McpToolError(
          `${method} ${url.pathname} failed with HTTP ${response.status}`,
          {
            response: body || text,
            ...(otpRequired ? { otpRequired } : {}),
          },
        );
      }

      return body as T;
    } catch (error) {
      if (error instanceof McpToolError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new McpToolError(`${method} ${url.pathname} timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithAuth(
    url: URL,
    method: HttpMethod,
    body: string | undefined,
    signal: AbortSignal,
    authMode: "strings-token" | "platform-jwt",
  ): Promise<Response> {
    const authorization = authMode === "strings-token"
      ? `token ${this.token}`
      : `Bearer ${await this.getPlatformJwt(signal)}`;

    return fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        ...(this.otp ? { "X-PhraseApp-OTP": this.otp } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body,
      signal,
    });
  }

  private async getPlatformJwt(signal: AbortSignal): Promise<string> {
    if (this.platformJwt) {
      return this.platformJwt;
    }

    const form = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: this.token,
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      subject_token_type: "urn:phrase:params:oauth:token-type:api_token",
    });

    const response = await fetch(this.platformTokenEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
      signal,
    });
    const text = await response.text();
    const body = parseResponseBody(text);

    if (!response.ok) {
      throw new McpToolError("Phrase authentication failed. Check PHRASE_ACCESS_TOKEN or PHRASE_TOKEN.", {
        status: response.status,
        response: body || text,
      });
    }

    if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).access_token !== "string") {
      throw new McpToolError("Phrase Platform token exchange did not return an access_token.", body);
    }

    this.platformJwt = (body as Record<string, string>).access_token;
    return this.platformJwt;
  }
}

function parseResponseBody(text: string): unknown {
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function readConfig(): Config {
  const token = process.env.PHRASE_ACCESS_TOKEN ?? process.env.PHRASE_TOKEN;

  if (!token || token === "replace-with-your-phrase-access-token") {
    throw new Error("Set PHRASE_ACCESS_TOKEN in .env to your Phrase access token.");
  }

  return {
    baseUrl: normalizeBaseUrl(process.env.PHRASE_API_BASE_URL ?? "https://api.phrase.com/v2"),
    token,
    platformTokenEndpoint: process.env.PHRASE_PLATFORM_TOKEN_ENDPOINT?.trim()
      || "https://eu.phrase.com/idm/oauth/token",
    defaultProjectId: process.env.PHRASE_PROJECT_ID?.trim() || undefined,
    defaultBranch: process.env.PHRASE_BRANCH?.trim() || undefined,
    otp: process.env.PHRASE_OTP?.trim() || undefined,
    timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 30000),
  };
}

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(error: unknown) {
  const payload =
    error instanceof McpToolError
      ? { error: error.message, details: error.details }
      : error instanceof Error
        ? { error: error.message }
        : { error: String(error) };

  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function titleFromName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function packageVersion(): string {
  try {
    const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "../package.json"), "utf8")) as {
      version?: string;
    };
    return packageJson.version ?? "1.0.0";
  } catch {
    return "1.0.0";
  }
}

function projectIdFromArgs(args: Record<string, unknown>, config: Config): string {
  const projectId = typeof args.projectId === "string" && args.projectId.trim()
    ? args.projectId.trim()
    : config.defaultProjectId;
  if (!projectId) {
    throw new McpToolError("projectId is required when PHRASE_PROJECT_ID is not configured.");
  }
  return projectId;
}

function branchFromArgs(args: Record<string, unknown>, config: Config): string | undefined {
  return typeof args.branch === "string" && args.branch.trim()
    ? args.branch.trim()
    : config.defaultBranch;
}

function withOptionalBranch(args: Record<string, unknown>, config: Config): { branch?: string } {
  const branch = branchFromArgs(args, config);
  return branch ? { branch } : {};
}

function cleanBody(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
}

async function main() {
  const config = readConfig();
  const phrase = new PhraseClient(
    config.baseUrl,
    config.token,
    config.platformTokenEndpoint,
    config.timeoutMs,
    config.otp,
  );

  const server = new McpServer({
    name: "lms-phrase-strings-mcp",
    version: packageVersion(),
  });

  const register = (
    name: string,
    description: string,
    inputSchema: Record<string, z.ZodTypeAny>,
    readOnly: boolean,
    handler: (args: Record<string, unknown>) => Promise<unknown>,
  ) => {
    server.registerTool(
      name,
      {
        title: titleFromName(name),
        description,
        inputSchema,
        annotations: {
          readOnlyHint: readOnly,
          destructiveHint: !readOnly,
          idempotentHint: readOnly,
          openWorldHint: true,
        },
      },
      async (args) => {
        try {
          return jsonResult(await handler(args as Record<string, unknown>));
        } catch (error) {
          return errorResult(error);
        }
      },
    );
  };

  register("list_phrase_projects", "List Phrase Strings projects accessible to the token.", {
    page: z.number().int().min(1).default(1),
    perPage: z.number().int().min(1).max(100).default(25),
    accountId: z.string().optional(),
    sortBy: ProjectSort.optional(),
    filters: z.array(z.string()).optional(),
  }, true, async ({ page, perPage, accountId, sortBy, filters }) =>
    phrase.request("GET", "/projects", {
      query: {
        page: Number(page),
        per_page: Number(perPage),
        account_id: accountId as string | undefined,
        sort_by: sortBy as string | undefined,
        filters: filters as string[] | undefined,
      },
    }),
  );

  register("get_phrase_project", "Get details for a Phrase Strings project.", {
    projectId: z.string().optional(),
  }, true, async (args) =>
    phrase.request("GET", `/projects/${projectIdFromArgs(args, config)}`),
  );

  register("list_phrase_locales", "List locales for a Phrase Strings project.", {
    projectId: z.string().optional(),
    branch: z.string().optional(),
    page: z.number().int().min(1).default(1),
    perPage: z.number().int().min(1).max(100).default(100),
    sortBy: LocaleSort.optional(),
  }, true, async (args) =>
    phrase.request("GET", `/projects/${projectIdFromArgs(args, config)}/locales`, {
      query: {
        ...withOptionalBranch(args, config),
        page: Number(args.page),
        per_page: Number(args.perPage),
        sort_by: args.sortBy as string | undefined,
      },
    }),
  );

  register("search_phrase_keys", "Search Phrase keys by name, query qualifiers, tags, and translation state.", {
    projectId: z.string().optional(),
    branch: z.string().optional(),
    query: z.string().optional(),
    tags: z.array(z.string()).optional(),
    translated: z.boolean().optional(),
    localeId: z.string().optional(),
    sort: KeySort.default("updated_at"),
    order: SortOrder.default("desc"),
    page: z.number().int().min(1).default(1),
    perPage: z.number().int().min(1).max(100).default(25),
  }, true, async (args) => {
    const terms: string[] = [];
    if (typeof args.query === "string" && args.query.trim()) {
      terms.push(args.query.trim());
    }
    if (Array.isArray(args.tags) && args.tags.length > 0) {
      terms.push(`tags:${args.tags.join(",")}`);
    }
    if (typeof args.translated === "boolean") {
      if (!args.localeId) {
        throw new McpToolError("localeId is required when filtering by translated state.");
      }
      terms.push(`translated:${args.translated}`);
    }

    return phrase.request("POST", `/projects/${projectIdFromArgs(args, config)}/keys/search`, {
      query: {
        page: Number(args.page),
        per_page: Number(args.perPage),
      },
      body: cleanBody({
        ...withOptionalBranch(args, config),
        q: terms.join(" ") || undefined,
        locale_id: args.localeId,
        sort: args.sort,
        order: args.order,
      }),
    });
  });

  register("get_phrase_key", "Get details for a single Phrase key.", {
    projectId: z.string().optional(),
    keyId: z.string(),
    branch: z.string().optional(),
  }, true, async (args) =>
    phrase.request("GET", `/projects/${projectIdFromArgs(args, config)}/keys/${args.keyId}`, {
      query: withOptionalBranch(args, config),
    }),
  );

  register("list_phrase_translations_by_locale", "List translations for a Phrase locale.", {
    projectId: z.string().optional(),
    localeId: z.string(),
    branch: z.string().optional(),
    query: z.string().optional(),
    sort: TranslationSort.default("updated_at"),
    order: SortOrder.default("desc"),
    page: z.number().int().min(1).default(1),
    perPage: z.number().int().min(1).max(100).default(25),
  }, true, async (args) =>
    phrase.request("GET", `/projects/${projectIdFromArgs(args, config)}/locales/${args.localeId}/translations`, {
      query: {
        ...withOptionalBranch(args, config),
        q: args.query as string | undefined,
        sort: args.sort as string,
        order: args.order as string,
        page: Number(args.page),
        per_page: Number(args.perPage),
      },
    }),
  );

  register("create_phrase_key", "Create a Phrase key, optionally with default-locale translation content.", {
    projectId: z.string().optional(),
    branch: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dataType: DataType.default("string"),
    plural: z.boolean().optional(),
    useOrdinalRules: z.boolean().optional(),
    namePlural: z.string().optional(),
    maxCharactersAllowed: z.number().int().min(1).optional(),
    defaultTranslationContent: z.string().optional(),
    autotranslate: z.boolean().optional(),
    unformatted: z.boolean().optional(),
    xmlSpacePreserve: z.boolean().optional(),
    originalFile: z.string().optional(),
    customMetadata: OptionalJsonObject,
  }, false, async (args) =>
    phrase.request("POST", `/projects/${projectIdFromArgs(args, config)}/keys`, {
      body: cleanBody({
        ...withOptionalBranch(args, config),
        name: args.name,
        description: args.description,
        tags: Array.isArray(args.tags) ? args.tags.join(",") : undefined,
        data_type: args.dataType,
        plural: args.plural,
        use_ordinal_rules: args.useOrdinalRules,
        name_plural: args.namePlural,
        max_characters_allowed: args.maxCharactersAllowed,
        default_translation_content: args.defaultTranslationContent,
        autotranslate: args.autotranslate,
        unformatted: args.unformatted,
        xml_space_preserve: args.xmlSpacePreserve,
        original_file: args.originalFile,
        custom_metadata: args.customMetadata,
      }),
    }),
  );

  register("create_phrase_translation", "Create translation content for a Phrase key and locale.", {
    projectId: z.string().optional(),
    branch: z.string().optional(),
    localeId: z.string(),
    keyId: z.string(),
    content: z.string(),
  }, false, async (args) =>
    phrase.request("POST", `/projects/${projectIdFromArgs(args, config)}/translations`, {
      body: cleanBody({
        ...withOptionalBranch(args, config),
        locale_id: args.localeId,
        key_id: args.keyId,
        content: args.content,
      }),
    }),
  );

  register("update_phrase_translation", "Update existing Phrase translation content and optional workflow fields.", {
    projectId: z.string().optional(),
    branch: z.string().optional(),
    translationId: z.string(),
    content: z.string().optional(),
    pluralSuffix: PluralSuffix.optional(),
    unverified: z.boolean().optional(),
    excluded: z.boolean().optional(),
    autotranslate: z.boolean().optional(),
    reviewed: z.boolean().optional(),
  }, false, async (args) =>
    phrase.request("PATCH", `/projects/${projectIdFromArgs(args, config)}/translations/${args.translationId}`, {
      body: cleanBody({
        ...withOptionalBranch(args, config),
        content: args.content,
        plural_suffix: args.pluralSuffix,
        unverified: args.unverified,
        excluded: args.excluded,
        autotranslate: args.autotranslate,
        reviewed: args.reviewed,
      }),
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
