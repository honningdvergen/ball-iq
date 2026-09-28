#!/usr/bin/env node
/**
 * postlog-metricool — after a Metricool createScheduledPost succeeds, write one post-log row per
 * network into social/state/posts_log.jsonl (social/postlog.mjs). social/pz logs Postiz posts itself;
 * this closes the Metricool door so the feedback loop never depends on remembering to log.
 * Drafts (draft:true) are not logged — they publish nothing.
 */
import path from 'node:path';

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', async () => {
  try {
    const input = JSON.parse(raw || '{}');
    if (!/createScheduledPost$/.test(input.tool_name || '')) return;
    let info = input.tool_input?.info; if (typeof info === 'string') info = JSON.parse(info);
    if (!info || info.draft === true) return;
    const resp = typeof input.tool_response === 'string' ? input.tool_response : JSON.stringify(input.tool_response || '');
    const uuid = (resp.match(/"uuid"\s*:\s*"([^"]+)"/) || [])[1] || '';
    const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
    const { logPost } = await import(path.join(root, 'social/postlog.mjs'));
    for (const p of info.providers || []) logPost({ platform: String(p.network).toLowerCase(), text: info.text || '', id: uuid, via: 'metricool', scheduledFor: info.publicationDate?.dateTime || '' });
  } catch { /* logging must never break publishing */ }
});
