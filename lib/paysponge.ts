/**
 * PaySponge MCP client — calls the Sponge Wallet API via JSON-RPC 2.0.
 * API base: https://api.wallet.paysponge.com
 */

const SPONGE_API_URL = "https://api.wallet.paysponge.com";
const MCP_ENDPOINT = `${SPONGE_API_URL}/mcp`;

// ─── MCP Transport ───────────────────────────────────────────────────────────

async function jsonrpc(
  apiKey: string,
  method: string,
  params: Record<string, unknown>,
  sessionId?: string
): Promise<{ result: unknown; sessionId: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: crypto.randomUUID(),
    }),
  });

  const returnedSessionId =
    res.headers.get("mcp-session-id") || sessionId || "";

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message || err?.message || msg;
    } catch {}
    throw new Error(`PaySponge error: ${msg}`);
  }

  const data = await res.json() as { result?: unknown; error?: { message: string } };
  if (data.error) throw new Error(`PaySponge RPC error: ${data.error.message}`);

  return { result: data.result, sessionId: returnedSessionId };
}

async function callTool(
  tool: string,
  toolArgs: Record<string, unknown>
): Promise<unknown> {
  const apiKey = process.env.SPONGE_API_KEY;
  if (!apiKey) throw new Error("SPONGE_API_KEY not configured");

  // Step 1: Initialize session
  const { result: initResult, sessionId } = await jsonrpc(apiKey, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "nemu-dashboard", version: "0.1.0" },
  });

  // Step 2: Notify initialized (fire-and-forget, don't fail if it errors)
  try {
    await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "Mcp-Session-Id": sessionId,
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
  } catch {}

  // Step 3: Call the tool
  const { result } = await jsonrpc(apiKey, "tools/call", { name: tool, arguments: toolArgs }, sessionId);

  // Parse the result — MCP returns { content: [{type:"text", text:"..."}] }
  const content = (result as { content?: { type: string; text: string }[] })?.content;
  if (content?.[0]?.text) {
    try {
      return JSON.parse(content[0].text);
    } catch {
      return content[0].text;
    }
  }
  return result;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface WalletBalance {
  address: string;
  eth: string;
  usdc: string;
  usdValue: string;
}

export interface WalletTransaction {
  hash: string;
  type: "send" | "receive";
  amount: string;
  currency: string;
  counterparty: string;
  timestamp: string;
  status: string;
}

export async function getWalletBalance(chain = "base-sepolia"): Promise<WalletBalance> {
  const data = await callTool("get_balance", { chain }) as Record<string, unknown>;

  const chainData = (data as Record<string, { address: string; balances: { token: string; amount: string; usdValue: string }[] }>)[chain];
  if (!chainData) throw new Error(`No data for chain: ${chain}`);

  const eth = chainData.balances.find((b) => b.token === "ETH");
  const usdc = chainData.balances.find((b) => b.token === "USDC");

  return {
    address: chainData.address,
    eth: eth?.amount ?? "0",
    usdc: usdc?.amount ?? "0",
    usdValue: usdc?.usdValue ?? "0",
  };
}

export async function getTransactionHistory(limit = 10, chain = "base-sepolia"): Promise<WalletTransaction[]> {
  const data = await callTool("get_transaction_history", { limit, chain }) as {
    transactions: {
      hash: string;
      type: string;
      amount: string;
      currency: string;
      from: string;
      to: string;
      timestamp: string;
      status: string;
    }[];
  };

  return (data.transactions ?? []).map((tx) => ({
    hash: tx.hash,
    type: tx.type as "send" | "receive",
    amount: tx.amount,
    currency: tx.currency ?? "USDC",
    counterparty: tx.type === "send" ? tx.to : tx.from,
    timestamp: tx.timestamp,
    status: tx.status ?? "confirmed",
  }));
}

export async function sendUsdc(
  to: string,
  amount: string,
  chain = "base-sepolia"
): Promise<{ txHash: string }> {
  const data = await callTool("evm_transfer", { chain, to, amount, currency: "USDC" }) as { txHash?: string; transaction_hash?: string };
  return { txHash: data.txHash ?? data.transaction_hash ?? "" };
}

export async function requestFunding(amount: string, chain = "base-sepolia"): Promise<void> {
  await callTool("request_funding", { amount, chain, currency: "USDC" });
}
