import * as folderV1 from "@grafana/grafana-foundation-sdk/folderv1";
import {
  ALERT_RULE_FOLDER_TITLE,
  ALERT_RULE_FOLDER_UID,
  DASHBOARD_FOLDER_TITLE,
  DASHBOARD_FOLDER_UID,
} from "./config.ts";
import { manifest } from "./resource-utils.ts";

const { FolderBuilder } = folderV1;

export function dashboardFolderResource() {
  return folderResource(
    DASHBOARD_FOLDER_UID,
    DASHBOARD_FOLDER_TITLE,
    "dashboard",
  );
}

export function alertRuleFolderResource() {
  return folderResource(
    ALERT_RULE_FOLDER_UID,
    ALERT_RULE_FOLDER_TITLE,
    "alert-rule",
  );
}

function folderResource(uid: string, title: string, resourceType: string) {
  return manifest(
    folderV1.FolderApiVersion,
    folderV1.FolderKind,
    uid,
    new FolderBuilder(title)
      .description("Resources generated from TypeScript and managed with gcx.")
      .build(),
    {},
    {
      "grafana-as-code/example": resourceType,
    },
  );
}
