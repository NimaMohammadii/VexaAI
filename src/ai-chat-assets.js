import { AI_CHAT_CLIENT_GZIP_BASE64 } from './ai-chat-client-data.js';
import { AI_CHAT_STYLES_GZIP_BASE64 } from './ai-chat-styles-data.js';

let clientPromise;
let stylesPromise;

export function getAiChatClient() {
  if (!clientPromise) {
    clientPromise = gunzipBase64(AI_CHAT_CLIENT_GZIP_BASE64);
  }

  return clientPromise;
}

export function getAiChatStyles() {
  if (!stylesPromise) {
    stylesPromise = gunzipBase64(AI_CHAT_STYLES_GZIP_BASE64);
  }

  return stylesPromise;
}

async function gunzipBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const decompressed = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));

  return new Response(decompressed).text();
}
