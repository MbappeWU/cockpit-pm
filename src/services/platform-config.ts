/**
 * Platform configuration — reads from VITE_* env vars.
 * .env file at project root, .env.example for reference.
 */

export interface FeishuConfig {
  appId: string;
  appSecret: string;
}

export interface JiraConfig {
  baseUrl: string;
  token: string;
}

export function getFeishuConfig(): FeishuConfig {
  return {
    appId: import.meta.env.VITE_FEISHU_APP_ID ?? '',
    appSecret: import.meta.env.VITE_FEISHU_APP_SECRET ?? '',
  };
}

export function getJiraConfig(): JiraConfig {
  return {
    baseUrl: import.meta.env.VITE_JIRA_BASE_URL ?? '',
    token: import.meta.env.VITE_JIRA_TOKEN ?? '',
  };
}

export function isFeishuConfigured(): boolean {
  const cfg = getFeishuConfig();
  return Boolean(cfg.appId && cfg.appSecret);
}

export function isJiraConfigured(): boolean {
  const cfg = getJiraConfig();
  return Boolean(cfg.baseUrl && cfg.token);
}

/** Platform status summary for UI display */
export function getPlatformStatus(): Array<{
  name: string;
  configured: boolean;
  detail: string;
}> {
  return [
    {
      name: '飞书(Feishu)',
      configured: isFeishuConfigured(),
      detail: isFeishuConfigured()
        ? `App: ${getFeishuConfig().appId.slice(0, 8)}...`
        : '未配置 — 请在 .env 中设置 VITE_FEISHU_APP_ID 和 VITE_FEISHU_APP_SECRET',
    },
    {
      name: 'JIRA',
      configured: isJiraConfigured(),
      detail: isJiraConfigured()
        ? `URL: ${getJiraConfig().baseUrl}`
        : '未配置 — 请在 .env 中设置 VITE_JIRA_BASE_URL 和 VITE_JIRA_TOKEN',
    },
  ];
}
