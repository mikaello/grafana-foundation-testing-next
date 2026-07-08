import {
  alertingProvisioningResources,
  alertRuleResources,
} from "./alerting.ts";
import { explorationDashboard, operationsDashboard } from "./dashboards.ts";
import { folderResource } from "./folders.ts";
import { prepareGeneratedDirectories, writeJson } from "./resource-utils.ts";

prepareGeneratedDirectories();

const resources = [
  {
    path: "resources/00-folder.json",
    resource: folderResource(),
  },
  {
    path: "resources/10-dashboard-operations-overview.json",
    resource: operationsDashboard(),
  },
  {
    path: "resources/11-dashboard-layout-exploration.json",
    resource: explorationDashboard(),
  },
];

const alertResources = alertRuleResources().map((resource, index) => ({
  path: `alerting-resources/${String(index + 10).padStart(2, "0")}-${resource.metadata.name}.json`,
  resource,
}));

const alertingResources = alertingProvisioningResources();
const alertingFiles = [
  {
    path: "alerting/contact-point-webhook.json",
    resource: alertingResources.webhookContactPoint,
  },
  {
    path: "alerting/contact-point-audit.json",
    resource: alertingResources.auditContactPoint,
  },
  {
    path: "alerting/notification-policy.json",
    resource: alertingResources.notificationPolicy,
  },
  {
    path: "alerting/mute-timing-maintenance.json",
    resource: alertingResources.maintenanceWindow,
  },
  {
    path: "alerting/notification-template.json",
    resource: alertingResources.template,
  },
  {
    path: "alerting/classic-rule-group.json",
    resource: alertingResources.classicAlertRuleGroup,
  },
];

for (const { path, resource } of [
  ...resources,
  ...alertResources,
  ...alertingFiles,
]) {
  writeJson(path, resource);
}
