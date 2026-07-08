import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import * as resource from "@grafana/grafana-foundation-sdk/resource";
import { GRAFANA_NAMESPACE } from "./config.ts";

const { ManifestBuilder, MetadataBuilder } = resource;

export function prepareGeneratedDirectories() {
  for (const directory of ["resources", "alerting-resources", "alerting"]) {
    rmSync(directory, { recursive: true, force: true });
    mkdirSync(directory, { recursive: true });
  }
}

export function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function manifest(
  apiVersion: string,
  kind: string,
  name: string,
  spec: unknown,
  annotations: Record<string, string> = {},
  labels: Record<string, string> = {},
) {
  return new ManifestBuilder()
    .apiVersion(apiVersion)
    .kind(kind)
    .metadata(metadata(name, annotations, labels))
    .spec(spec)
    .build();
}

export function rawBuilder<T>(value: T) {
  return {
    build: () => value,
  };
}

function metadata(
  name: string,
  annotations: Record<string, string> = {},
  labels: Record<string, string> = {},
) {
  const builder = new MetadataBuilder().name(name).namespace(GRAFANA_NAMESPACE);

  if (Object.keys(annotations).length > 0) {
    builder.annotations(annotations);
  }

  if (Object.keys(labels).length > 0) {
    builder.labels(labels);
  }

  return builder;
}
