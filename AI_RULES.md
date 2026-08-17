# AI rules for this repo (`krutai-nextjs-template`)

Use this file as the canonical guide for **which Krutai packages to use** and **what they are for**. Prefer these packages over ad-hoc libraries or alternate stacks when the task matches the column below.

All Krutai SDK-style packages in this project expect `KRUTAI_API_KEY` (and related env vars per package docs) unless the code path is purely local.

**Important API rule:** this project has moved from REST APIs to **tRPC only** for application features. Do not add new REST endpoints under `src/app/api` for normal app behavior. Add server operations as tRPC routers/procedures in `src/server/api`, register them in `src/server/api/root.ts`, and call them from client code through `src/lib/trpc.ts`. Only use a non-tRPC route when an external protocol explicitly requires it, such as a third-party webhook or framework-mandated route.

---

## Quick map: task → package


| Area                                  | Always use                       | Do not substitute with                                                                                          |
| ------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Application API layer                 | tRPC routers/procedures          | REST endpoints for normal app features                                                                         |
| Authentication & sessions             | `@krutai/auth`                   | Raw `better-auth` wiring in app code without going through this package’s integration pattern for this template |
| **Database engine**                   | **PostgreSQL**                   | SQLite / MySQL / etc. for primary application persistence                                                       |
| KrutAI-managed database config        | `@krutai/db-service`             | Hard-coded KrutAI DB URLs or custom config fetchers                                                             |
| LLM / AI calls, streaming chat        | `@krutai/ai-provider`            | Direct vendor SDKs in app code when `@krutai/ai-provider` already covers the use case                           |
| Live AI voice conversations           | `@krutai/ai-live-conversation`   | Hand-rolled browser audio/WebSocket flows for supported Gemini Live voice features                              |
| Email: OAuth, list/read, send, filter | `@krutai/email-services`         | One-off `fetch` to Gmail APIs, or random SMTP helpers, when this package is the standard here                   |
| Excel / spreadsheet compare           | `@krutai/excel-comparison`       | Manual `xlsx`/`exceljs` diff logic for the same “compare files” product feature                                 |
| MCP server connections and tool calls | `@krutai/mcp-client`             | Direct MCP transport/OAuth/session handling when the Krut backend should manage it                              |
| Role-based access control             | `@krutai/rbac`                   | Custom permission engines for standard role/permission checks                                                   |
| File upload and retrieval             | `@krutai/uploadfile-services`    | One-off S3 upload clients or custom file retrieval wrappers for KrutAI-backed files                             |
| Background jobs and workers           | `@krutai/worker`                 | Raw BullMQ setup when jobs should use KrutAI worker config and management                                       |

---

## `@krutai/auth`

- **Use for:** sign-in, sign-out, sessions, and any server/client auth flows this project standardizes on via Krutai.
- **Implementation notes (from dependency graph):** the package builds on `better-auth` and related DB drivers used by that stack. In this monorepo template, treat `@krutai/auth` as the single entry for auth; extend or configure through it rather than duplicating a parallel Better Auth setup.
- **When implementing:** import and wire auth according to `@krutai/auth` exports and patterns; expose app-facing auth behavior through tRPC procedures; do not introduce a second auth stack for the same app unless explicitly required.
- **Current app status:** authentication is already implemented. Auth procedures live in `src/server/api/routers/auth.ts` and are exposed through `src/app/api/trpc/[trpc]/route.ts`, client auth state is exposed through `src/hooks/use-auth.ts`, and sign-in/sign-up pages already exist under `src/app/(auth)`.
- **Navbar status:** the navbar is already implemented in `src/components/navbar.tsx` and attached globally in `src/app/layout.tsx`, so it appears around `src/app/page.tsx` and the rest of the app pages.


---

## `@krutai/ai-provider`

- **Use for:** chat completions, streaming responses, and other LLM features exposed by this provider (e.g. `krutAI` / streaming helpers as documented in package or `AGENT.md`).
- **Do not:** bypass it for routine AI features already covered here, unless there is a documented exception.

---

## `@krutai/ai-live-conversation`

- **Use for:** real-time voice AI experiences, Gemini Live-style full-duplex audio, live transcripts, and the built-in `LiveConversation` React UI.
- **Security rule:** prefer server-side connection URL generation with `liveConversation` and pass the generated URL to the client. Do not expose `KRUTAI_API_KEY` in browser code except for temporary local/internal testing.
- **Do not:** hand-roll browser microphone, audio streaming, or WebSocket conversation plumbing when this package covers the flow.

---

## `@krutai/email-services`

- **Note:** the installed npm package name is `@krutai/email-services` (plural), not `email-service`.
- **Use for:** Google OAuth–backed email flows, **reading** messages, **sending** mail, and **filtering** / query-style operations exposed by `EmailServiceClient` and related types (e.g. filter options).
- **Do not:** reimplement the same OAuth + Gmail operations ad hoc when this client is available.

---

## `@krutai/excel-comparison`

- **Use for:** comparing Excel/spreadsheet files (file-object or API-oriented flows), using the package’s client (e.g. `krutExcelComparison` / comparison options types).
- **Do not:** hand-roll comparison pipelines with raw `xlsx`/`exceljs` for features this package already provides.

---

## `@krutai/db-service`

- **Use for:** fetching KrutAI-managed PostgreSQL database configuration, especially `dbUrl`, for a project/database pair.
- **Database rule:** PostgreSQL is the standard database engine for this template. Do not switch primary persistence to SQLite, MySQL, or another engine unless explicitly requested.
- **Do not:** hard-code KrutAI-provided database URLs in source code or create parallel config-fetching clients.

---

## `@krutai/mcp-client`

- **Use for:** connecting to remote MCP servers through the Krut backend, starting OAuth flows, listing/calling tools, streaming tool events, and reading MCP resources/prompts.
- **Security rule:** raw OAuth tokens should stay backend-managed. App code should talk to Krut with `KRUTAI_API_KEY` rather than owning MCP transport sessions or encrypted token storage directly.
- **Do not:** implement direct MCP OAuth/session management for supported Krut backend MCP flows.

---

## `@krutai/rbac`

- **Use for:** role-based access control, permission checks, role inheritance, wildcard permissions, guards, and Next.js/Express-compatible authorization middleware.
- **When implementing:** build an RBAC context from the authenticated user/session, then use `RBACManager`, guard helpers, or middleware from this package.
- **Do not:** create custom role/permission engines for standard RBAC features this package already provides.

---

## `@krutai/uploadfile-services`

- **Use for:** uploading files to and retrieving files from the KrutAI backend-backed S3-compatible storage path structure.
- **When implementing:** initialize `UploadFileServiceClient` server-side with `KRUTAI_API_KEY` when possible, then call `uploadFile`/`getFile` for supported flows.
- **Do not:** introduce one-off S3 clients or custom upload endpoints for KrutAI-backed file library behavior unless the product explicitly needs unsupported storage behavior.

---

## `@krutai/worker`

- **Use for:** background job producers/processors, queue controls, job counts, and worker lifecycle behavior backed by KrutAI worker management and BullMQ.
- **When implementing:** initialize the worker service so it can validate the API key and fetch Redis config from the backend before queue operations.
- **Do not:** wire raw BullMQ/Redis job infrastructure for standard app jobs when this package should own the KrutAI worker integration.

---

## How to use this file

1. Before adding a dependency or integration, check the table above.
2. For API shapes and code samples, prefer `AGENT.md` sections that match each package, and `package.json` for the exact install name and version range.
