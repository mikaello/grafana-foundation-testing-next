export const TESTDATA_DATASOURCE_NAME = "grafana-testdata-datasource";
export const TESTDATA_DATASOURCE_UID =
  process.env.GRAFANA_TESTDATA_DATASOURCE_UID ?? TESTDATA_DATASOURCE_NAME;
export const GRAFANA_NAMESPACE =
  process.env.GRAFANA_NAMESPACE ?? "stacks-1030830";
export const DASHBOARD_FOLDER_UID =
  process.env.GRAFANA_DASHBOARD_FOLDER_UID ?? "grafana-as-code-dashboards";
export const DASHBOARD_FOLDER_TITLE =
  process.env.GRAFANA_DASHBOARD_FOLDER_TITLE ?? "Grafana as Code Dashboards";
export const ALERT_RULE_FOLDER_UID =
  process.env.GRAFANA_ALERT_RULE_FOLDER_UID ??
  process.env.GRAFANA_FOLDER_UID ??
  "grafana-as-code-alert-rules";
export const ALERT_RULE_FOLDER_TITLE =
  process.env.GRAFANA_ALERT_RULE_FOLDER_TITLE ??
  process.env.GRAFANA_FOLDER_TITLE ??
  "Grafana as Code Alert Rules";
export const ALERT_CONTACT_POINT =
  process.env.GRAFANA_ALERT_CONTACT_POINT ?? "grafana-as-code-webhook";
export const EMAIL_CONTACT_POINT_NAME =
  process.env.GRAFANA_EMAIL_CONTACT_POINT ?? "grafana-as-code-email";
export const EMAIL_CONTACT_POINT_ADDRESS =
  process.env.GRAFANA_EMAIL_CONTACT_POINT_ADDRESS ??
  "kickers-prewar0x@icloud.com";

export type JsonObject = Record<string, unknown>;
