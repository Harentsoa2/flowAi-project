import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, Message, TextMessage } from "@inngest/agent-kit";

import { SANDBOX_TIMEOUT } from "./types";

const SANDBOX_APP_DIR = "/home/user";
const SANDBOX_SERVER_PORT = 3000;
const SERVER_READY_TIMEOUT_MS = 60_000;
const SERVER_POLL_INTERVAL_MS = 1_000;
const SERVER_CHECK_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  await sandbox.setTimeout(SANDBOX_TIMEOUT);
  return sandbox;
};

type SandboxCommandProcess = Awaited<ReturnType<Sandbox["commands"]["list"]>>[number];

const getProcessCommand = (process: SandboxCommandProcess) => (
  [process.cmd, ...process.args].join(" ")
);

const isNextDevProcess = (process: SandboxCommandProcess) => {
  const command = getProcessCommand(process);
  return /\bnext\b/.test(command) && /\bdev\b/.test(command);
};

const isPublicNextDevProcess = (process: SandboxCommandProcess) => {
  const command = getProcessCommand(process);
  return (
    isNextDevProcess(process) &&
    command.includes("0.0.0.0") &&
    command.includes(`${SANDBOX_SERVER_PORT}`)
  );
};

const isSandboxServerResponding = async (sandbox: Sandbox) => {
  try {
    const result = await sandbox.commands.run(
      `sh -lc 'curl -sS --max-time 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:${SANDBOX_SERVER_PORT} || true'`,
      {
        timeoutMs: SERVER_CHECK_TIMEOUT_MS,
      },
    );

    const statusCode = result.stdout.trim();
    return statusCode !== "" && statusCode !== "000";
  } catch (error) {
    console.warn("Sandbox server readiness check timed out or failed", error);
    return false;
  }
};

const startSandboxServer = async (sandbox: Sandbox) => {
  const processes = await sandbox.commands.list();
  const hasPublicServer = processes.some(isPublicNextDevProcess);

  if (hasPublicServer) {
    return;
  }

  for (const process of processes.filter(isNextDevProcess)) {
    await sandbox.commands.kill(process.pid);
  }

  await sandbox.commands.run(
    "sh -lc 'exec npx next dev --turbopack --hostname 0.0.0.0 --port 3000 > /tmp/next-dev.log 2>&1'",
    {
      background: true,
      cwd: SANDBOX_APP_DIR,
      envs: {
        HOSTNAME: "0.0.0.0",
        PORT: `${SANDBOX_SERVER_PORT}`,
      },
      timeoutMs: 5_000,
    },
  );
};

export async function ensureSandboxServer(sandbox: Sandbox) {
  await startSandboxServer(sandbox);

  const startedAt = Date.now();

  while (Date.now() - startedAt < SERVER_READY_TIMEOUT_MS) {
    if (await isSandboxServerResponding(sandbox)) {
      return;
    }

    await sleep(SERVER_POLL_INTERVAL_MS);
  }

  const logs = await sandbox.commands.run(
    "sh -lc 'tail -n 80 /tmp/next-dev.log 2>/dev/null || true'",
    {
      timeoutMs: 5_000,
    },
  );

  throw new Error(
    `Next.js did not start on port ${SANDBOX_SERVER_PORT}.\n${logs.stdout}`,
  );
}

export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant",
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
};

export const parseAgentOutput = (value: Message[]) => {
  const output = value[0];

  if (output.type !== "text") {
    return "Fragment";
  }

  if (Array.isArray(output.content)) {
    return output.content.map((txt) => txt).join("")
  } else {
    return output.content
  }
};
