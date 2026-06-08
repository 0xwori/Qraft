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

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Query = Record<string, string | number | boolean | undefined>;

type Config = {
  jiraUrl: string;
  confluenceUrl?: string;
  defaultProjectKey?: string;
  token: string;
  jiraApiVersion: string;
  timeoutMs: number;
};

class McpToolError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "McpToolError";
  }
}

class RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly timeoutMs: number,
  ) {}

  async request<T = unknown>(
    method: HttpMethod,
    route: string,
    options: { query?: Query; body?: unknown } = {},
  ): Promise<T> {
    const url = new URL(route, `${this.baseUrl}/`);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const text = await response.text();
      const body = parseResponseBody(text);

      if (!response.ok) {
        throw new McpToolError(
          `${method} ${url.pathname} failed with HTTP ${response.status}`,
          body || text,
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
  const jiraUrl = process.env.JIRA_URL ?? process.env.JIRA_BASE_URL;
  const token = process.env.JIRA_PAT ?? process.env.ATLASSIAN_PAT;

  if (!jiraUrl || jiraUrl.includes("example.com")) {
    throw new Error("Set JIRA_URL in .env to your Jira base URL.");
  }
  if (!token || token === "replace-with-your-personal-access-token") {
    throw new Error("Set JIRA_PAT in .env to your Jira Personal Access Token.");
  }

  const verifyTls = (process.env.VERIFY_TLS ?? "true").toLowerCase();
  if (verifyTls === "false") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  return {
    jiraUrl: normalizeBaseUrl(jiraUrl),
    confluenceUrl: process.env.CONFLUENCE_URL ? normalizeBaseUrl(process.env.CONFLUENCE_URL) : undefined,
    defaultProjectKey: (process.env.JIRA_PROJECT ?? process.env.JIRA_PROJECT_KEY)?.trim() || undefined,
    token,
    jiraApiVersion: process.env.JIRA_API_VERSION ?? "2",
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

function quoteJqlText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function withDefaultProject(fields: Record<string, unknown>, defaultProjectKey?: string): Record<string, unknown> {
  if (!defaultProjectKey || fields.project) {
    return fields;
  }
  return {
    ...fields,
    project: { key: defaultProjectKey },
  };
}

async function main() {
  const config = readConfig();
  const jira = new RestClient(config.jiraUrl, config.token, config.timeoutMs);
  const confluence = config.confluenceUrl
    ? new RestClient(config.confluenceUrl, config.token, config.timeoutMs)
    : undefined;

  const jiraApi = `/rest/api/${config.jiraApiVersion}`;
  const jiraAgileApi = "/rest/agile/1.0";
  const confluenceApi = "/rest/api";

  const requireConfluence = () => {
    if (!confluence) {
      throw new McpToolError("CONFLUENCE_URL is not configured. Set it in .env to use Confluence tools.");
    }
    return confluence;
  };

  const server = new McpServer({
    name: "legacy-jira-confluence-mcp",
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

  register("retrieve_confluence_page", "Retrieve a Confluence page by content ID.", {
    pageId: z.string(),
    expand: z.string().default("body.storage,version,space,ancestors"),
  }, true, async ({ pageId, expand }) =>
    requireConfluence().request("GET", `${confluenceApi}/content/${pageId}`, {
      query: { expand: String(expand) },
    }),
  );

  register("search_confluence_cql", "Search Confluence with CQL.", {
    cql: z.string(),
    limit: z.number().int().min(1).max(100).default(25),
    start: z.number().int().min(0).default(0),
    expand: z.string().optional(),
  }, true, async ({ cql, limit, start, expand }) =>
    requireConfluence().request("GET", `${confluenceApi}/content/search`, {
      query: { cql: String(cql), limit: Number(limit), start: Number(start), expand: expand as string | undefined },
    }),
  );

  register("get_issue", "Get a Jira issue by key or ID.", {
    issueKeyOrId: z.string(),
    fields: z.string().optional(),
    expand: z.string().optional(),
  }, true, async ({ issueKeyOrId, fields, expand }) =>
    jira.request("GET", `${jiraApi}/issue/${issueKeyOrId}`, {
      query: { fields: fields as string | undefined, expand: expand as string | undefined },
    }),
  );

  register("update_issue", "Update fields on a Jira issue.", {
    issueKeyOrId: z.string(),
    fields: OptionalJsonObject,
    update: OptionalJsonObject,
    notifyUsers: z.boolean().optional(),
  }, false, async ({ issueKeyOrId, fields, update, notifyUsers }) =>
    jira.request("PUT", `${jiraApi}/issue/${issueKeyOrId}`, {
      query: { notifyUsers: notifyUsers as boolean | undefined },
      body: { fields: fields ?? undefined, update: update ?? undefined },
    }),
  );

  register("create_issue", "Create a Jira issue.", {
    fields: JsonObject,
    update: OptionalJsonObject,
  }, false, async ({ fields, update }) =>
    jira.request("POST", `${jiraApi}/issue`, {
      body: {
        fields: withDefaultProject(fields as Record<string, unknown>, config.defaultProjectKey),
        update: update ?? undefined,
      },
    }),
  );

  register("transition_issue", "Transition a Jira issue.", {
    issueKeyOrId: z.string(),
    transitionId: z.string(),
    fields: OptionalJsonObject,
    update: OptionalJsonObject,
    comment: z.string().optional(),
  }, false, async ({ issueKeyOrId, transitionId, fields, update, comment }) => {
    const body: Record<string, unknown> = {
      transition: { id: transitionId },
      fields: fields ?? undefined,
      update: update ?? undefined,
    };

    if (comment) {
      body.update = {
        ...(typeof update === "object" && update ? update : {}),
        comment: [{ add: { body: comment } }],
      };
    }

    return jira.request("POST", `${jiraApi}/issue/${issueKeyOrId}/transitions`, { body });
  });

  register("search_jql", "Search Jira issues with JQL.", {
    jql: z.string(),
    startAt: z.number().int().min(0).default(0),
    maxResults: z.number().int().min(1).max(100).default(25),
    fields: z.array(z.string()).optional(),
    expand: z.array(z.string()).optional(),
  }, true, async ({ jql, startAt, maxResults, fields, expand }) =>
    jira.request("POST", `${jiraApi}/search`, {
      body: { jql, startAt, maxResults, fields, expand },
    }),
  );

  register("get_current_user_info", "Get the current Jira user.", {}, true, async () =>
    jira.request("GET", `${jiraApi}/myself`),
  );

  register("list_accessible_resources", "List configured Jira and Confluence resources.", {}, true, async () => ({
    resources: [
      { type: "jira", url: config.jiraUrl, api: jiraApi, defaultProjectKey: config.defaultProjectKey },
      ...(config.confluenceUrl ? [{ type: "confluence", url: config.confluenceUrl, api: confluenceApi }] : []),
    ],
  }));

  register("get_spaces", "Get Confluence spaces.", {
    limit: z.number().int().min(1).max(100).default(25),
    start: z.number().int().min(0).default(0),
    type: z.string().optional(),
    status: z.string().optional(),
  }, true, async ({ limit, start, type, status }) =>
    requireConfluence().request("GET", `${confluenceApi}/space`, {
      query: { limit: Number(limit), start: Number(start), type: type as string | undefined, status: status as string | undefined },
    }),
  );

  register("get_pages_in_space", "Get pages in a Confluence space.", {
    spaceKey: z.string(),
    limit: z.number().int().min(1).max(100).default(25),
    start: z.number().int().min(0).default(0),
    expand: z.string().default("version,space"),
  }, true, async ({ spaceKey, limit, start, expand }) =>
    requireConfluence().request("GET", `${confluenceApi}/content`, {
      query: { spaceKey: String(spaceKey), type: "page", limit: Number(limit), start: Number(start), expand: String(expand) },
    }),
  );

  register("get_page_comments", "Get footer comments on a Confluence page.", {
    pageId: z.string(),
    limit: z.number().int().min(1).max(100).default(25),
    start: z.number().int().min(0).default(0),
    expand: z.string().default("body.storage,version,extensions"),
  }, true, async ({ pageId, limit, start, expand }) =>
    requireConfluence().request("GET", `${confluenceApi}/content/${pageId}/child/comment`, {
      query: { limit: Number(limit), start: Number(start), expand: String(expand), location: "footer" },
    }),
  );

  register("list_page_inline_comments", "List inline comments on a Confluence page.", {
    pageId: z.string(),
    limit: z.number().int().min(1).max(100).default(50),
    start: z.number().int().min(0).default(0),
    expand: z.string().default("body.storage,version,extensions"),
  }, true, async ({ pageId, limit, start, expand }) => {
    const result = await requireConfluence().request<Record<string, unknown>>(
      "GET",
      `${confluenceApi}/content/${pageId}/child/comment`,
      { query: { limit: Number(limit), start: Number(start), expand: String(expand) } },
    );
    const results = Array.isArray(result.results) ? result.results : [];
    return {
      ...result,
      results: results.filter((comment) =>
        JSON.stringify((comment as Record<string, unknown>).extensions ?? {}).includes("inline"),
      ),
    };
  });

  register("get_comment_replies", "Get replies to a Confluence comment.", {
    commentId: z.string(),
    limit: z.number().int().min(1).max(100).default(25),
    start: z.number().int().min(0).default(0),
    expand: z.string().default("body.storage,version,extensions"),
  }, true, async ({ commentId, limit, start, expand }) =>
    requireConfluence().request("GET", `${confluenceApi}/content/${commentId}/child/comment`, {
      query: { limit: Number(limit), start: Number(start), expand: String(expand) },
    }),
  );

  register("list_page_descendants", "List descendant pages under a Confluence page.", {
    pageId: z.string(),
    limit: z.number().int().min(1).max(100).default(25),
    start: z.number().int().min(0).default(0),
    expand: z.string().default("version,space"),
  }, true, async ({ pageId, limit, start, expand }) =>
    requireConfluence().request("GET", `${confluenceApi}/content/${pageId}/descendant/page`, {
      query: { limit: Number(limit), start: Number(start), expand: String(expand) },
    }),
  );

  register("get_transitions", "Get available transitions for a Jira issue.", {
    issueKeyOrId: z.string(),
    expand: z.string().optional(),
  }, true, async ({ issueKeyOrId, expand }) =>
    jira.request("GET", `${jiraApi}/issue/${issueKeyOrId}/transitions`, {
      query: { expand: expand as string | undefined },
    }),
  );

  register("get_remote_links", "Get remote links for a Jira issue.", {
    issueKeyOrId: z.string(),
    globalId: z.string().optional(),
  }, true, async ({ issueKeyOrId, globalId }) =>
    jira.request("GET", `${jiraApi}/issue/${issueKeyOrId}/remotelink`, {
      query: { globalId: globalId as string | undefined },
    }),
  );

  register("get_projects", "Get visible Jira projects.", {
    recent: z.number().int().min(1).optional(),
  }, true, async ({ recent }) =>
    jira.request("GET", `${jiraApi}/project`, {
      query: { recent: recent as number | undefined },
    }),
  );

  register("get_project_versions", "Get Jira versions for a project.", {
    projectKey: z.string().optional(),
    useDefaultProject: z.boolean().default(true),
  }, true, async ({ projectKey, useDefaultProject }) => {
    const effectiveProjectKey =
      projectKey ?? (useDefaultProject && config.defaultProjectKey ? config.defaultProjectKey : undefined);
    if (!effectiveProjectKey) {
      throw new McpToolError("projectKey is required when no default project is configured.");
    }
    return jira.request("GET", `${jiraApi}/project/${effectiveProjectKey}/versions`);
  });

  register("create_project_version", "Create a Jira project version/fixVersion.", {
    name: z.string(),
    projectKey: z.string().optional(),
    description: z.string().optional(),
    releaseDate: z.string().optional(),
    startDate: z.string().optional(),
    archived: z.boolean().default(false),
    released: z.boolean().default(false),
    useDefaultProject: z.boolean().default(true),
  }, false, async ({ name, projectKey, description, releaseDate, startDate, archived, released, useDefaultProject }) => {
    const effectiveProjectKey =
      projectKey ?? (useDefaultProject && config.defaultProjectKey ? config.defaultProjectKey : undefined);
    if (!effectiveProjectKey) {
      throw new McpToolError("projectKey is required when no default project is configured.");
    }
    return jira.request("POST", `${jiraApi}/version`, {
      body: {
        name,
        project: effectiveProjectKey,
        description: description ?? undefined,
        releaseDate: releaseDate ?? undefined,
        startDate: startDate ?? undefined,
        archived,
        released,
      },
    });
  });

  register("get_agile_boards", "Get Jira Agile boards, optionally filtered by project.", {
    projectKeyOrId: z.string().optional(),
    type: z.string().optional(),
    startAt: z.number().int().min(0).default(0),
    maxResults: z.number().int().min(1).max(100).default(50),
  }, true, async ({ projectKeyOrId, type, startAt, maxResults }) =>
    jira.request("GET", `${jiraAgileApi}/board`, {
      query: {
        projectKeyOrId: projectKeyOrId as string | undefined,
        type: type as string | undefined,
        startAt: Number(startAt),
        maxResults: Number(maxResults),
      },
    }),
  );

  register("get_board_sprints", "Get sprints for a Jira Agile board.", {
    boardId: z.number().int().min(1),
    state: z.string().optional(),
    startAt: z.number().int().min(0).default(0),
    maxResults: z.number().int().min(1).max(100).default(50),
  }, true, async ({ boardId, state, startAt, maxResults }) =>
    jira.request("GET", `${jiraAgileApi}/board/${boardId}/sprint`, {
      query: {
        state: state as string | undefined,
        startAt: Number(startAt),
        maxResults: Number(maxResults),
      },
    }),
  );

  register("get_current_sprint_for_project", "Get the first active sprint found for a Jira project.", {
    projectKeyOrId: z.string().optional(),
    useDefaultProject: z.boolean().default(true),
  }, true, async ({ projectKeyOrId, useDefaultProject }) => {
    const effectiveProjectKey =
      projectKeyOrId ?? (useDefaultProject && config.defaultProjectKey ? config.defaultProjectKey : undefined);
    if (!effectiveProjectKey) {
      throw new McpToolError("projectKeyOrId is required when no default project is configured.");
    }

    const boardsResponse = await jira.request<Record<string, unknown>>("GET", `${jiraAgileApi}/board`, {
      query: { projectKeyOrId: String(effectiveProjectKey), maxResults: 100 },
    });
    const boards = Array.isArray(boardsResponse.values) ? boardsResponse.values : [];

    for (const board of boards) {
      const boardId = (board as Record<string, unknown>).id;
      if (typeof boardId !== "number") {
        continue;
      }
      const sprintsResponse = await jira.request<Record<string, unknown>>("GET", `${jiraAgileApi}/board/${boardId}/sprint`, {
        query: { state: "active", maxResults: 50 },
      });
      const sprints = Array.isArray(sprintsResponse.values) ? sprintsResponse.values : [];
      if (sprints.length > 0) {
        return { board, sprint: sprints[0] };
      }
    }

    return { board: null, sprint: null };
  });

  register("add_issues_to_sprint", "Add Jira issues to a sprint.", {
    sprintId: z.number().int().min(1),
    issueKeys: z.array(z.string()).min(1),
  }, false, async ({ sprintId, issueKeys }) =>
    jira.request("POST", `${jiraAgileApi}/sprint/${sprintId}/issue`, {
      body: { issues: issueKeys },
    }),
  );

  register("get_issue_types", "Get Jira issue types.", {}, true, async () =>
    jira.request("GET", `${jiraApi}/issuetype`),
  );

  register("get_field_metadata", "Get Jira field metadata or create metadata for a project/issue type.", {
    projectKeys: z.string().optional(),
    issueTypeNames: z.string().optional(),
    useDefaultProject: z.boolean().default(true),
    expand: z.string().default("projects.issuetypes.fields"),
  }, true, async ({ projectKeys, issueTypeNames, useDefaultProject, expand }) => {
    const effectiveProjectKeys =
      projectKeys ?? (useDefaultProject && config.defaultProjectKey ? config.defaultProjectKey : undefined);

    if (effectiveProjectKeys || issueTypeNames) {
      return jira.request("GET", `${jiraApi}/issue/createmeta`, {
        query: {
          projectKeys: effectiveProjectKeys as string | undefined,
          issuetypeNames: issueTypeNames as string | undefined,
          expand: String(expand),
        },
      });
    }
    return jira.request("GET", `${jiraApi}/field`);
  });

  register("lookup_users", "Search Jira users visible to the token.", {
    query: z.string(),
    maxResults: z.number().int().min(1).max(100).default(25),
    includeActive: z.boolean().default(true),
    includeInactive: z.boolean().default(false),
  }, true, async ({ query, maxResults, includeActive, includeInactive }) =>
    jira.request("GET", `${jiraApi}/user/search`, {
      query: {
        username: String(query),
        maxResults: Number(maxResults),
        includeActive: Boolean(includeActive),
        includeInactive: Boolean(includeInactive),
      },
    }),
  );

  register("get_issue_link_types", "Get Jira issue link types.", {}, true, async () =>
    jira.request("GET", `${jiraApi}/issueLinkType`),
  );

  register("rovo_search_jira_and_confluence", "Search Jira and Confluence with a plain text query.", {
    query: z.string(),
    jiraMaxResults: z.number().int().min(1).max(100).default(10),
    confluenceLimit: z.number().int().min(1).max(100).default(10),
    useDefaultProject: z.boolean().default(true),
  }, true, async ({ query, jiraMaxResults, confluenceLimit, useDefaultProject }) => {
    const text = quoteJqlText(String(query));
    const projectClause = useDefaultProject && config.defaultProjectKey
      ? `project = "${quoteJqlText(config.defaultProjectKey)}" AND `
      : "";
    const jiraPromise = jira.request("POST", `${jiraApi}/search`, {
      body: {
        jql: `${projectClause}text ~ "${text}" ORDER BY updated DESC`,
        maxResults: Number(jiraMaxResults),
        fields: ["summary", "status", "assignee", "reporter", "updated"],
      },
    });

    const confluencePromise = confluence
      ? confluence.request("GET", `${confluenceApi}/content/search`, {
          query: {
            cql: `type in (page,blogpost) and (title ~ "${text}" or text ~ "${text}") order by lastmodified desc`,
            limit: Number(confluenceLimit),
            expand: "space,version",
          },
        })
      : Promise.resolve({ skipped: "CONFLUENCE_URL is not configured." });

    const [jiraResult, confluenceResult] = await Promise.allSettled([jiraPromise, confluencePromise]);
    return {
      jira: jiraResult.status === "fulfilled" ? jiraResult.value : errorToPayload(jiraResult.reason),
      confluence: confluenceResult.status === "fulfilled" ? confluenceResult.value : errorToPayload(confluenceResult.reason),
    };
  });

  register("fetch_content_with_ari", "Fetch Jira or Confluence content using an ARI, URL, issue key, or content ID.", {
    resource: z.string(),
    expand: z.string().optional(),
  }, true, async ({ resource, expand }) => {
    const ref = String(resource);
    const issueKey = extractIssueKey(ref);
    if (issueKey) {
      return jira.request("GET", `${jiraApi}/issue/${issueKey}`, {
        query: { expand: expand as string | undefined },
      });
    }

    const pageId = extractConfluenceContentId(ref);
    if (pageId) {
      return requireConfluence().request("GET", `${confluenceApi}/content/${pageId}`, {
        query: { expand: (expand as string | undefined) ?? "body.storage,version,space" },
      });
    }

    throw new McpToolError("Could not resolve resource as a Jira issue key or Confluence content ID.", { resource });
  });

  register("create_confluence_page", "Create a Confluence page.", {
    spaceKey: z.string(),
    title: z.string(),
    body: z.string(),
    parentId: z.string().optional(),
    representation: z.string().default("storage"),
  }, false, async ({ spaceKey, title, body, parentId, representation }) =>
    requireConfluence().request("POST", `${confluenceApi}/content`, {
      body: {
        type: "page",
        title,
        space: { key: spaceKey },
        ancestors: parentId ? [{ id: parentId }] : undefined,
        body: { storage: { value: body, representation } },
      },
    }),
  );

  register("update_confluence_page", "Update a Confluence page. Fetches the current version when versionNumber is omitted.", {
    pageId: z.string(),
    title: z.string(),
    body: z.string(),
    versionNumber: z.number().int().min(1).optional(),
    representation: z.string().default("storage"),
    minorEdit: z.boolean().default(false),
  }, false, async ({ pageId, title, body, versionNumber, representation, minorEdit }) => {
    const client = requireConfluence();
    const current = versionNumber
      ? undefined
      : await client.request<Record<string, unknown>>("GET", `${confluenceApi}/content/${pageId}`, {
          query: { expand: "version" },
        });
    const currentVersion = current?.version as { number?: number } | undefined;

    return client.request("PUT", `${confluenceApi}/content/${pageId}`, {
      body: {
        id: pageId,
        type: "page",
        title,
        version: {
          number: versionNumber ?? Number(currentVersion?.number ?? 0) + 1,
          minorEdit,
        },
        body: { storage: { value: body, representation } },
      },
    });
  });

  register("create_confluence_footer_comment", "Create a footer comment on a Confluence page.", {
    pageId: z.string(),
    body: z.string(),
    representation: z.string().default("storage"),
  }, false, async ({ pageId, body, representation }) =>
    requireConfluence().request("POST", `${confluenceApi}/content`, {
      body: {
        type: "comment",
        container: { id: pageId, type: "page" },
        body: { storage: { value: body, representation } },
      },
    }),
  );

  register("create_confluence_inline_comment", "Create an inline Confluence comment. Pass inlineProperties for your Confluence version.", {
    pageId: z.string(),
    body: z.string(),
    inlineProperties: OptionalJsonObject,
    representation: z.string().default("storage"),
  }, false, async ({ pageId, body, inlineProperties, representation }) =>
    requireConfluence().request("POST", `${confluenceApi}/content`, {
      body: {
        type: "comment",
        container: { id: pageId, type: "page" },
        extensions: {
          location: "inline",
          inlineProperties: inlineProperties ?? {},
        },
        body: { storage: { value: body, representation } },
      },
    }),
  );

  register("add_comment", "Add a comment to a Jira issue.", {
    issueKeyOrId: z.string(),
    body: z.string(),
    visibility: OptionalJsonObject,
  }, false, async ({ issueKeyOrId, body, visibility }) =>
    jira.request("POST", `${jiraApi}/issue/${issueKeyOrId}/comment`, {
      body: { body, visibility: visibility ?? undefined },
    }),
  );

  register("add_or_update_worklog", "Add or update a Jira issue worklog.", {
    issueKeyOrId: z.string(),
    timeSpent: z.string().optional(),
    timeSpentSeconds: z.number().int().min(1).optional(),
    started: z.string().optional(),
    comment: z.string().optional(),
    worklogId: z.string().optional(),
    adjustEstimate: z.string().optional(),
    newEstimate: z.string().optional(),
    reduceBy: z.string().optional(),
  }, false, async ({ issueKeyOrId, worklogId, adjustEstimate, newEstimate, reduceBy, ...worklog }) =>
    jira.request(worklogId ? "PUT" : "POST", `${jiraApi}/issue/${issueKeyOrId}/worklog${worklogId ? `/${worklogId}` : ""}`, {
      query: {
        adjustEstimate: adjustEstimate as string | undefined,
        newEstimate: newEstimate as string | undefined,
        reduceBy: reduceBy as string | undefined,
      },
      body: worklog,
    }),
  );

  register("create_issue_link", "Create a link between two Jira issues.", {
    typeName: z.string(),
    inwardIssueKey: z.string(),
    outwardIssueKey: z.string(),
    comment: z.string().optional(),
  }, false, async ({ typeName, inwardIssueKey, outwardIssueKey, comment }) =>
    jira.request("POST", `${jiraApi}/issueLink`, {
      body: {
        type: { name: typeName },
        inwardIssue: { key: inwardIssueKey },
        outwardIssue: { key: outwardIssueKey },
        comment: comment ? { body: comment } : undefined,
      },
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function titleFromName(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function packageVersion(): string {
  try {
    const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));
    return String(packageJson.version ?? "1.0.0");
  } catch {
    return "1.0.0";
  }
}

function errorToPayload(error: unknown) {
  return error instanceof McpToolError
    ? { error: error.message, details: error.details }
    : error instanceof Error
      ? { error: error.message }
      : { error: String(error) };
}

function extractIssueKey(value: string): string | undefined {
  const browseMatch = value.match(/\/browse\/([A-Z][A-Z0-9]+-\d+)/i);
  if (browseMatch) {
    return browseMatch[1].toUpperCase();
  }
  const ariMatch = value.match(/issue\/([A-Z][A-Z0-9]+-\d+)/i);
  if (ariMatch) {
    return ariMatch[1].toUpperCase();
  }
  const directMatch = value.match(/\b([A-Z][A-Z0-9]+-\d+)\b/i);
  return directMatch?.[1]?.toUpperCase();
}

function extractConfluenceContentId(value: string): string | undefined {
  const pageIdMatch = value.match(/[?&]pageId=(\d+)/i);
  if (pageIdMatch) {
    return pageIdMatch[1];
  }
  const pagesMatch = value.match(/\/pages\/(?:viewpage\.action\?pageId=)?(\d+)/i);
  if (pagesMatch) {
    return pagesMatch[1];
  }
  const contentMatch = value.match(/content\/(\d+)/i);
  if (contentMatch) {
    return contentMatch[1];
  }
  return /^\d+$/.test(value) ? value : undefined;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
