export const TESTDATA_DATASOURCE_NAME = "grafana-testdata-datasource";
export const TESTDATA_DATASOURCE_UID =
  process.env.GRAFANA_TESTDATA_DATASOURCE_UID ?? TESTDATA_DATASOURCE_NAME;
export const GRAFANA_NAMESPACE =
  process.env.GRAFANA_NAMESPACE ?? "stacks-1030830";
export const FOLDER_UID =
  process.env.GRAFANA_FOLDER_UID ?? "grafana-as-code-lab";
export const FOLDER_TITLE =
  process.env.GRAFANA_FOLDER_TITLE ?? "Grafana as Code Lab";
export const DASHBOARD_FOLDER_UID =
  process.env.GRAFANA_DASHBOARD_FOLDER_UID ?? "";
export const ALERT_CONTACT_POINT =
  process.env.GRAFANA_ALERT_CONTACT_POINT ?? "grafana-as-code-webhook";

export type JsonObject = Record<string, unknown>;
