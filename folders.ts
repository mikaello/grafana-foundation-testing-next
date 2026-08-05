import * as folderV1 from "@grafana/grafana-foundation-sdk/folderv1";
import { FOLDER_TITLE, FOLDER_UID } from "./config.ts";
import { manifest } from "./resource-utils.ts";

const { FolderBuilder } = folderV1;

export function folderResource() {
  return manifest(
    folderV1.FolderApiVersion,
    folderV1.FolderKind,
    FOLDER_UID,
    new FolderBuilder(FOLDER_TITLE)
      .description("Resources generated from TypeScript and managed with gcx.")
      .build(),
    {},
    {
      "grafana-as-code/example": "folder",
    },
  );
}
