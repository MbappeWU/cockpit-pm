/**
 * push-feishu.ts
 *
 * Push daily digest to Feishu group via webhook.
 */

import { formatDigestMarkdown, type DailyDigest } from './analyzers/digest-generator.js';

/**
 * Push digest to Feishu group webhook
 */
export async function pushDigestToFeishu(digest: DailyDigest): Promise<boolean> {
  const webhookUrl = process.env.FEISHU_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[push] No FEISHU_WEBHOOK_URL configured, skipping push');
    return false;
  }

  const markdown = formatDigestMarkdown(digest);

  // Feishu interactive card format
  const card = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: `🚗 座舱项目日报 ${digest.date}`,
        },
        template: digest.riskTop5.some((p) => p.riskLevel === 'critical')
          ? 'red'
          : 'blue',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: markdown,
          },
        },
        {
          tag: 'hr',
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: `由 Cockpit PM v3.0 自动生成 | ${new Date().toLocaleTimeString('zh-CN')}`,
            },
          ],
        },
      ],
    },
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (resp.ok) {
      const data = (await resp.json()) as { StatusCode?: number; StatusMessage?: string };
      if (data.StatusCode === 0) {
        console.log('[push] Digest pushed to Feishu successfully');
        return true;
      }
      console.warn(`[push] Feishu webhook response: ${data.StatusMessage}`);
    } else {
      console.warn(`[push] Feishu webhook HTTP ${resp.status}`);
    }
  } catch (err) {
    console.warn(`[push] Failed to push to Feishu: ${err}`);
  }

  return false;
}
