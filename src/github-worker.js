import app from './index.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = 'gpt-5.6-luna';
const GITHUB_API = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const MAX_AGENT_STEPS = 8;

const GITHUB_AGENT_INSTRUCTIONS = `
You are Vexa, an AI assistant inside a Telegram Mini App.
You alone decide the user's intent. Never rely on keyword matching or hard-coded intent rules.
Return exactly one JSON object and no markdown.

Normal response:
{"type":"message","message":"your answer"}

Image request:
{"type":"image_request","prompt":"the image prompt","size":"1024x1024"}

Speech request:
{"type":"speech_request","text":"the exact text to speak","voice":"Nora"}

When the user wants to connect GitHub, work in a repository, inspect code, fix a bug, add a feature, create or edit files, make a pull request, review CI, deploy through the repository, or merge a pull request:
- If GitHub is not connected, return:
{"type":"github_connect","message":"Connect your GitHub repository so I can access the code and work on it."}
- If GitHub is connected, choose and return one GitHub action at a time. The server will execute it and send the result back to you.

Available GitHub actions:
1. List accessible repositories:
{"type":"github_action","action":"list_repositories"}

2. Inspect a repository tree:
{"type":"github_action","action":"inspect_repository","repository":"owner/name","branch":"main"}

3. Read exact files after inspecting the tree:
{"type":"github_action","action":"read_files","repository":"owner/name","branch":"main","paths":["src/file.js","package.json"]}

4. Create a branch, commit complete file contents, and open a pull request:
{"type":"github_action","action":"create_pull_request","repository":"owner/name","base_branch":"main","title":"Clear PR title","summary":"What changed and why","files":[{"path":"src/file.js","content":"complete replacement file content"}]}

5. Merge a pull request only when the user explicitly asks to merge it:
{"type":"github_action","action":"merge_pull_request","repository":"owner/name","pull_number":123,"merge_method":"squash"}

6. Check a pull request and its workflow status:
{"type":"github_action","action":"pull_request_status","repository":"owner/name","pull_number":123}

Rules:
- Investigate before editing. Inspect the tree and read the relevant files first.
- Use one clean implementation path. Do not add parallel, duplicate, fallback, or speculative code paths.
- Never guess file names or architecture.
- Never push directly to the default branch. Use create_pull_request.
- Change only files required by the request.
- For create_pull_request, include the complete final content of every changed file.
- Do not merge unless the latest user message explicitly requests a merge.
- After a successful action, explain the result naturally with a normal message.
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/github/connected') {
      return handleGitHubConnected(url, env);
    }

    if (request.method === 'POST' && url.pathname === '/mini-app/api/github/connect') {
      return handleGitHubConnectRequest(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/mini-app/api/github/webhook') {
      return handleGitHubWebhook(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/mini-app/api/chat') {
      return handleAgentChat(request, env);
    }

    return app.fetch(request, env, ctx);
  }
};

async function handleAgentChat(request, env) {
  const apiKey = getOpenAiApiKey(env);
  if (!apiKey) return jsonResponse({ error: 'OpenAI API key is not configured' }, 500);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid chat request' }, 400);
  }

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-20) : [];
  if (!messages.length) return jsonResponse({ error: 'No chat messages were provided' }, 400);

  const initData = String(payload.initData || '');
  const connection = await verifyConnectionToken(String(payload.githubConnection || ''), initData, env);
  const preferredVoice = getPreferredVoice(messages);
  const conversation = messages.map(buildOpenAiMessage).filter(Boolean);

  conversation.push({
    role: 'user',
    content: `SYSTEM CONNECTION STATE: ${connection ? `GitHub connected with installation ${connection.installationId}.` : 'GitHub is not connected.'}`
  });

  let result;
  let usedGitHub = false;

  for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
    result = await askModel(apiKey, conversation, preferredVoice);

    if (result.type === 'github_connect') {
      const connect = await createInstallUrl(initData, env);
      return ndjsonResponse([
        { type: 'status', status: 'thinking' },
        {
          type: 'result',
          data: {
            type: 'github_connect',
            message: String(result.message || 'Connect your GitHub repository so I can access the code and work on it.'),
            connectUrl: connect.url
          }
        }
      ]);
    }

    if (result.type !== 'github_action') break;

    if (!connection) {
      const connect = await createInstallUrl(initData, env);
      return ndjsonResponse([
        { type: 'status', status: 'thinking' },
        {
          type: 'result',
          data: {
            type: 'github_connect',
            message: 'Connect your GitHub repository so I can access the code and work on it.',
            connectUrl: connect.url
          }
        }
      ]);
    }

    usedGitHub = true;
    const actionResult = await executeGitHubAction(result, connection.installationId, messages, env);
    conversation.push({ role: 'assistant', content: JSON.stringify(result) });
    conversation.push({
      role: 'user',
      content: `GITHUB ACTION RESULT:\n${JSON.stringify(actionResult)}`
    });
  }

  if (!result) return jsonResponse({ error: 'The model returned an empty response' }, 502);
  const finalResult = normalizeResult(result, preferredVoice);

  return ndjsonResponse([
    {
      type: 'status',
      status: finalResult.type === 'speech_request' ? 'generating_voice' : usedGitHub ? 'working_on_repository' : 'thinking'
    },
    { type: 'result', data: finalResult }
  ]);
}

async function askModel(apiKey, input, preferredVoice) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: `${GITHUB_AGENT_INSTRUCTIONS}\nPreferred voice: ${preferredVoice}`,
      input,
      tools: [{ type: 'web_search', search_context_size: 'medium' }],
      tool_choice: 'auto',
      max_output_tokens: 16000,
      store: false
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data && data.error && data.error.message ? data.error.message : 'OpenAI request failed');
  }

  const text = extractOpenAiText(data);
  if (!text) throw new Error('The model returned an empty response');
  return parseJsonObject(text);
}

async function executeGitHubAction(action, installationId, messages, env) {
  const token = await createInstallationToken(installationId, env);
  const name = String(action.action || '');

  if (name === 'list_repositories') {
    const data = await githubRequest('/installation/repositories?per_page=100', token);
    return {
      repositories: (data.repositories || []).map((repo) => ({
        full_name: repo.full_name,
        private: repo.private,
        default_branch: repo.default_branch,
        language: repo.language,
        updated_at: repo.updated_at
      }))
    };
  }

  const repository = validateRepository(action.repository);

  if (name === 'inspect_repository') {
    const repo = await githubRequest(`/repos/${repository}`, token);
    const branch = String(action.branch || repo.default_branch || 'main');
    const tree = await githubRequest(`/repos/${repository}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token);
    return {
      repository,
      default_branch: repo.default_branch,
      branch,
      truncated: !!tree.truncated,
      files: (tree.tree || [])
        .filter((item) => item.type === 'blob')
        .slice(0, 4000)
        .map((item) => ({ path: item.path, size: item.size, sha: item.sha }))
    };
  }

  if (name === 'read_files') {
    const branch = String(action.branch || 'main');
    const paths = Array.isArray(action.paths) ? action.paths.slice(0, 30) : [];
    if (!paths.length) throw new Error('No files were selected to read');
    const files = [];
    for (const path of paths) {
      const cleanPath = validatePath(path);
      const data = await githubRequest(`/repos/${repository}/contents/${encodePath(cleanPath)}?ref=${encodeURIComponent(branch)}`, token);
      if (data.type !== 'file') throw new Error(`${cleanPath} is not a file`);
      const content = decodeBase64(String(data.content || '').replace(/\s/g, ''));
      files.push({ path: cleanPath, sha: data.sha, content: content.slice(0, 180000) });
    }
    return { repository, branch, files };
  }

  if (name === 'create_pull_request') {
    const files = Array.isArray(action.files) ? action.files.slice(0, 40) : [];
    if (!files.length) throw new Error('No file changes were provided');
    const repo = await githubRequest(`/repos/${repository}`, token);
    const baseBranch = String(action.base_branch || repo.default_branch || 'main');
    const baseRef = await githubRequest(`/repos/${repository}/git/ref/heads/${encodeURIComponent(baseBranch)}`, token);
    const baseCommitSha = baseRef.object.sha;
    const baseCommit = await githubRequest(`/repos/${repository}/git/commits/${baseCommitSha}`, token);
    const treeEntries = [];

    for (const file of files) {
      const path = validatePath(file.path);
      const content = String(file.content == null ? '' : file.content);
      const blob = await githubRequest(`/repos/${repository}/git/blobs`, token, {
        method: 'POST',
        body: { content, encoding: 'utf-8' }
      });
      treeEntries.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    const tree = await githubRequest(`/repos/${repository}/git/trees`, token, {
      method: 'POST',
      body: { base_tree: baseCommit.tree.sha, tree: treeEntries }
    });
    const title = String(action.title || 'Vexa AI changes').slice(0, 200);
    const commit = await githubRequest(`/repos/${repository}/git/commits`, token, {
      method: 'POST',
      body: { message: title, tree: tree.sha, parents: [baseCommitSha] }
    });
    const branch = `vexa/${Date.now().toString(36)}-${slugify(title).slice(0, 38)}`;
    await githubRequest(`/repos/${repository}/git/refs`, token, {
      method: 'POST',
      body: { ref: `refs/heads/${branch}`, sha: commit.sha }
    });
    const pr = await githubRequest(`/repos/${repository}/pulls`, token, {
      method: 'POST',
      body: {
        title,
        head: branch,
        base: baseBranch,
        body: String(action.summary || 'Changes created by Vexa AI.'),
        maintainer_can_modify: true
      }
    });
    return {
      success: true,
      repository,
      branch,
      commit_sha: commit.sha,
      pull_number: pr.number,
      pull_url: pr.html_url,
      changed_files: treeEntries.map((item) => item.path)
    };
  }

  if (name === 'merge_pull_request') {
    if (!latestUserExplicitlyRequestedMerge(messages)) {
      return { success: false, requires_explicit_confirmation: true, message: 'The user must explicitly ask to merge this pull request.' };
    }
    const pullNumber = Number(action.pull_number);
    if (!Number.isInteger(pullNumber) || pullNumber < 1) throw new Error('Invalid pull request number');
    const merged = await githubRequest(`/repos/${repository}/pulls/${pullNumber}/merge`, token, {
      method: 'PUT',
      body: { merge_method: ['merge', 'rebase', 'squash'].includes(action.merge_method) ? action.merge_method : 'squash' }
    });
    return { success: !!merged.merged, sha: merged.sha, message: merged.message, pull_number: pullNumber };
  }

  if (name === 'pull_request_status') {
    const pullNumber = Number(action.pull_number);
    const pr = await githubRequest(`/repos/${repository}/pulls/${pullNumber}`, token);
    const checks = await githubRequest(`/repos/${repository}/commits/${pr.head.sha}/check-runs?per_page=100`, token);
    const runs = await githubRequest(`/repos/${repository}/actions/runs?head_sha=${encodeURIComponent(pr.head.sha)}&per_page=30`, token);
    return {
      pull_number: pullNumber,
      state: pr.state,
      mergeable: pr.mergeable,
      mergeable_state: pr.mergeable_state,
      draft: pr.draft,
      url: pr.html_url,
      checks: (checks.check_runs || []).map((check) => ({ name: check.name, status: check.status, conclusion: check.conclusion })),
      workflows: (runs.workflow_runs || []).map((run) => ({ name: run.name, status: run.status, conclusion: run.conclusion, url: run.html_url }))
    };
  }

  throw new Error(`Unsupported GitHub action: ${name}`);
}

async function handleGitHubConnectRequest(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request' }, 400);
  }
  const result = await createInstallUrl(String(payload.initData || ''), env);
  return jsonResponse(result);
}

async function createInstallUrl(initData, env) {
  if (!initData) throw new Error('Open the app inside Telegram before connecting GitHub');
  const jwt = await createAppJwt(env);
  const appInfo = await githubRequest('/app', jwt, { appAuth: true });
  const userHash = await sha256Base64Url(initData);
  const state = await signPayload({ userHash, exp: Math.floor(Date.now() / 1000) + 1800 }, env);
  return { url: `${appInfo.html_url}/installations/new?state=${encodeURIComponent(state)}` };
}

async function handleGitHubConnected(url, env) {
  const installationId = Number(url.searchParams.get('installation_id'));
  const state = String(url.searchParams.get('state') || '');
  const stateData = await verifySignedPayload(state, env);
  if (!Number.isInteger(installationId) || installationId < 1 || !stateData || !stateData.userHash) {
    return textResponse('GitHub connection could not be verified.', 'text/plain; charset=UTF-8', 400);
  }
  const connection = await signPayload({
    installationId,
    userHash: stateData.userHash,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
  }, env);
  const appUrl = String(env.APP_URL || 'https://vchat.vexaagent.workers.dev').replace(/\/$/, '');
  return Response.redirect(`${appUrl}/?github_connection=${encodeURIComponent(connection)}`, 302);
}

async function handleGitHubWebhook(request, env) {
  const secret = String(env.GITHUB_WEBHOOK_SECRET || '');
  const signature = String(request.headers.get('x-hub-signature-256') || '');
  const body = await request.arrayBuffer();
  if (!secret || !(await verifyWebhookSignature(body, signature, secret))) {
    return jsonResponse({ error: 'Invalid webhook signature' }, 401);
  }
  return jsonResponse({ ok: true });
}

async function verifyConnectionToken(token, initData, env) {
  if (!token || !initData) return null;
  const payload = await verifySignedPayload(token, env);
  if (!payload || !payload.installationId || !payload.userHash) return null;
  const userHash = await sha256Base64Url(initData);
  return timingSafeEqualText(userHash, payload.userHash) ? payload : null;
}

async function createInstallationToken(installationId, env) {
  const jwt = await createAppJwt(env);
  const data = await githubRequest(`/app/installations/${installationId}/access_tokens`, jwt, {
    method: 'POST',
    body: {},
    appAuth: true
  });
  return data.token;
}

async function createAppJwt(env) {
  const appId = String(env.GITHUB_APP_ID || '').trim();
  const pem = String(env.GITHUB_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  if (!appId || !pem) throw new Error('GitHub App credentials are not configured');
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncodeText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncodeText(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey('pkcs8', pemToPkcs8(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method: options.method || 'GET',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `${options.appAuth ? 'Bearer' : 'token'} ${token}`,
      'content-type': 'application/json',
      'user-agent': 'VexaAI-GitHub-Agent',
      'x-github-api-version': GITHUB_API_VERSION
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `GitHub request failed (${response.status})`);
  return data;
}

function pemToPkcs8(pem) {
  const clean = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const keyBytes = base64ToBytes(clean);
  if (pem.includes('BEGIN PRIVATE KEY')) return keyBytes.buffer;
  if (!pem.includes('BEGIN RSA PRIVATE KEY')) throw new Error('Unsupported GitHub private key format');
  const algorithm = new Uint8Array([0x30,0x0d,0x06,0x09,0x2a,0x86,0x48,0x86,0xf7,0x0d,0x01,0x01,0x01,0x05,0x00]);
  const wrapped = concatBytes(algorithm, derWrap(0x04, keyBytes));
  return derWrap(0x30, concatBytes(new Uint8Array([0x02,0x01,0x00]), derWrap(0x30, wrapped))).buffer;
}

function derWrap(tag, bytes) {
  const length = bytes.length;
  let lengthBytes;
  if (length < 128) lengthBytes = new Uint8Array([length]);
  else {
    const parts = [];
    let value = length;
    while (value > 0) { parts.unshift(value & 255); value >>= 8; }
    lengthBytes = new Uint8Array([0x80 | parts.length, ...parts]);
  }
  return concatBytes(new Uint8Array([tag]), lengthBytes, bytes);
}

function concatBytes(...arrays) {
  const total = arrays.reduce((sum, array) => sum + array.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((array) => { output.set(array, offset); offset += array.length; });
  return output;
}

async function signPayload(payload, env) {
  const encoded = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await hmac(encoded, String(env.GITHUB_WEBHOOK_SECRET || ''));
  return `${encoded}.${signature}`;
}

async function verifySignedPayload(token, env) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;
  const expected = await hmac(encoded, String(env.GITHUB_WEBHOOK_SECRET || ''));
  if (!timingSafeEqualText(signature, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hmac(value, secret) {
  if (!secret) throw new Error('GITHUB_WEBHOOK_SECRET is not configured');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

async function verifyWebhookSignature(body, signature, secret) {
  if (!signature.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, body);
  const expected = `sha256=${bytesToHex(new Uint8Array(signed))}`;
  return timingSafeEqualText(signature, expected);
}

function latestUserExplicitlyRequestedMerge(messages) {
  const latest = [...messages].reverse().find((message) => message && message.role !== 'assistant');
  const text = String(latest && latest.content || '').toLowerCase();
  return /\bmerge\b|\bmerge it\b|مرج|ادغام/.test(text);
}

function validateRepository(value) {
  const repository = String(value || '').trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid repository name');
  return repository;
}

function validatePath(value) {
  const path = String(value || '').replace(/^\/+/, '').trim();
  if (!path || path.includes('..') || path.includes('\\')) throw new Error('Invalid repository path');
  return path;
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'change';
}

function parseJsonObject(text) {
  const clean = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch { return { type: 'message', message: clean }; }
}

function normalizeResult(result, preferredVoice) {
  if (result.type === 'speech_request' && String(result.text || '').trim()) {
    return { type: 'speech_request', text: String(result.text).trim(), voice: String(result.voice || preferredVoice) };
  }
  if (result.type === 'image_request' && String(result.prompt || '').trim()) {
    return { type: 'image_request', prompt: String(result.prompt).trim(), size: String(result.size || '1024x1024') };
  }
  return { type: 'message', message: String(result.message || 'Done.'), voice: preferredVoice };
}

function buildOpenAiMessage(message) {
  if (!message || typeof message !== 'object') return null;
  const role = message.role === 'assistant' ? 'assistant' : 'user';
  const text = String(message.content || '').trim();
  const attachment = message.attachment;
  if (role === 'assistant' || !attachment) return text ? { role, content: text } : null;
  const content = [];
  if (text) content.push({ type: 'input_text', text });
  const dataUrl = String(attachment.dataUrl || '');
  if (attachment.isImage && dataUrl.startsWith('data:image/')) content.push({ type: 'input_image', image_url: dataUrl, detail: 'auto' });
  else if (dataUrl.includes(';base64,')) content.push({ type: 'input_file', filename: String(attachment.name || 'attachment'), file_data: dataUrl.split(';base64,')[1] });
  return content.length ? { role, content } : null;
}

function getPreferredVoice(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index] && messages[index].preferredVoice) return String(messages[index].preferredVoice);
  }
  return 'Nora';
}

function getOpenAiApiKey(env) {
  return String(env.OPENAI_API_KEY || env.GPT_API_KEY || env.GPT_API || env.API_GPT || '').trim();
}

function extractOpenAiText(data) {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const output = data && Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content.text === 'string' && content.text.trim()) return content.text.trim();
    }
  }
  return '';
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

function base64UrlEncodeText(value) { return base64UrlEncodeBytes(new TextEncoder().encode(value)); }
function base64UrlEncodeBytes(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return base64ToBytes(base64);
}
function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function decodeBase64(value) { return new TextDecoder().decode(base64ToBytes(value)); }
function bytesToHex(bytes) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''); }
function timingSafeEqualText(first, second) {
  const a = new TextEncoder().encode(String(first));
  const b = new TextEncoder().encode(String(second));
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function noStoreHeaders(contentType) {
  return { 'content-type': contentType, 'cache-control': 'no-store, no-cache, must-revalidate', pragma: 'no-cache', expires: '0' };
}
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: noStoreHeaders('application/json; charset=UTF-8') });
}
function textResponse(value, contentType, status = 200) {
  return new Response(value, { status, headers: noStoreHeaders(contentType) });
}
function ndjsonResponse(events) {
  return new Response(events.map((event) => JSON.stringify(event)).join('\n') + '\n', { status: 200, headers: noStoreHeaders('application/x-ndjson; charset=UTF-8') });
}
