import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import { openai, createAgent, createTool, createNetwork, type Tool, type Message, createState } from "@inngest/agent-kit";

import { prisma } from "@/lib/db";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";

import { inngest } from "./client";
import { SANDBOX_TIMEOUT } from "./types";
import { getSandbox, lastAssistantTextMessageContent, parseAgentOutput } from "./utils";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
};

const HOME_DIR = "/home/user";

const normalizeSandboxWritePath = (filePath: string) => {
  const normalizedPath = filePath
    .replace(/\\/g, "/")
    .replace(/^\/home\/user\//, "");

  if (
    !normalizedPath ||
    normalizedPath.startsWith("/") ||
    normalizedPath.startsWith("@") ||
    normalizedPath.includes(":") ||
    normalizedPath.split("/").includes("..")
  ) {
    return null;
  }

  return normalizedPath;
};

const normalizeSandboxReadPath = (filePath: string) => {
  const normalizedPath = filePath.replace(/\\/g, "/");

  if (
    !normalizedPath ||
    normalizedPath.startsWith("@") ||
    normalizedPath.includes(":") ||
    normalizedPath.split("/").includes("..") ||
    (normalizedPath.startsWith("/") && !normalizedPath.startsWith(`${HOME_DIR}/`))
  ) {
    return null;
  }

  return normalizedPath.startsWith("/")
    ? normalizedPath
    : `${HOME_DIR}/${normalizedPath}`;
};

const fixCommonGeneratedSyntaxIssues = (filePath: string, content: string) => {
  if (!/\.(tsx?|jsx?)$/.test(filePath)) {
    return content;
  }

  return content
    .replace(/\b(from\s*)`([^`\r\n]+)`/g, '$1"$2"')
    .replace(/(^|\n)(\s*import\s*)`([^`\r\n]+)`(\s*;?)/g, '$1$2"$3"$4')
    .replace(/\b(import\s*\(\s*)`([^`\r\n]+)`(\s*\))/g, '$1"$2"$3');
};

const FALLBACK_UI_COMPONENTS = {
  button: {
    path: "components/ui/button.tsx",
    content: `import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const variants = {
  default: "bg-black text-white hover:bg-black/90",
  outline: "border border-neutral-300 bg-white hover:bg-neutral-100",
  secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
  ghost: "hover:bg-neutral-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  link: "text-blue-600 underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
  lg: "h-11 px-6",
  icon: "h-10 w-10",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild: _asChild,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
`,
  },
  card: {
    path: "components/ui/card.tsx",
    content: `import * as React from "react";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn("rounded-lg border bg-white text-neutral-950 shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: DivProps) {
  return <div className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: DivProps) {
  return <div className={cn("text-sm text-neutral-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
`,
  },
};

const hasUiImport = (content: string, componentName: string) =>
  new RegExp(`["']@/components/ui/${componentName}["']`).test(content);

const ensureFallbackUiComponents = async (
  sandbox: Awaited<ReturnType<typeof getSandbox>>,
  content: string,
  updatedFiles: AgentState["files"],
) => {
  for (const [componentName, component] of Object.entries(FALLBACK_UI_COMPONENTS)) {
    if (!hasUiImport(content, componentName)) {
      continue;
    }

    try {
      await sandbox.files.read(`${HOME_DIR}/${component.path}`);
    } catch {
      await sandbox.files.write(component.path, component.content);
      updatedFiles[component.path] = component.content;
    }
  }
};

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create(
        process.env.E2B_TEMPLATE_NAME ?? "flowai-nextjs-001",
      );
      await sandbox.setTimeout(SANDBOX_TIMEOUT);
      return sandbox.sandboxId;
    });

    const previousMessages = await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[] = [];

      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        })
      }

      return formattedMessages.reverse();
    });

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      },
    );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ 
        model: "gpt-5.4-mini",
        defaultParameters: {
          temperature: 0.1,
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal for package installs or lightweight checks. Do not start dev/build/start servers.",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                });
                return result.stdout;
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox. Use relative paths like app/page.tsx.",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  const normalizedPath = normalizeSandboxWritePath(file.path);

                  if (!normalizedPath) {
                    return `Error: invalid file path "${file.path}". Use a relative sandbox path like "app/page.tsx".`;
                  }

                  const content = fixCommonGeneratedSyntaxIssues(
                    normalizedPath,
                    file.content,
                  );

                  await ensureFallbackUiComponents(
                    sandbox,
                    content,
                    updatedFiles,
                  );

                  await sandbox.files.write(normalizedPath, content);
                  updatedFiles[normalizedPath] = content;
                }

                return updatedFiles;
              } catch (e) {
                return "Error: " + e;
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          }
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox. Use /home/user paths or relative paths; do not use @ aliases.",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const normalizedPath = normalizeSandboxReadPath(file);

                  if (!normalizedPath) {
                    return `Error: invalid file path "${file}". Use "/home/user/app/page.tsx" or "app/page.tsx".`;
                  }

                  const content = await sandbox.files.read(normalizedPath);
                  contents.push({ path: normalizedPath, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            })
          },
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({ 
        model: "gpt-4o",
      }),
    })

    const responseGenerator = createAgent({
      name: "response-generator",
      description: "A response generator",
      system: RESPONSE_PROMPT,
      model: openai({ 
        model: "gpt-4o",
      }),
    });

    const { 
      output: fragmentTitleOuput
    } = await fragmentTitleGenerator.run(result.state.data.summary);
    const { 
      output: responseOutput
    } = await responseGenerator.run(result.state.data.summary);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(responseOutput),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOuput),
              files: result.state.data.files,
            },
          },
        },
      })
    });

    return { 
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
