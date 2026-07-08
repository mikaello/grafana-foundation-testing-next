# grafana-foundation-testing-next

Explore Grafana as code with the Grafana Foundation SDK, Dashboard V2, and `gcx`.

## Generate resources

```sh
npm run build
```

The generator writes:

- `resources/` for folders and Dashboard V2 manifests used by `gcx resources`.
- `alerting-resources/` for App Platform alert rules.
- `alerting/` for contact points, notification policy, mute timing, notification template, and a classic alert rule group.

Generated directories are ignored because the TypeScript source files are the source of truth.

`index.ts` lists every generated output file.
`dashboards.ts`, `alerting.ts`, and `folders.ts` define the resource builders.
`config.ts` and `resource-utils.ts` hold shared settings and helpers.

## Validate and dry-run

```sh
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... npm run validate
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... npm run dry-run
```

Alert rules require their folder and contact point to exist before server-side validation.

```sh
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... gcx resources push folders/grafana-as-code-lab -p resources
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... gcx alert contact-points create -f alerting/contact-point-webhook.json
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... npm run validate:alerts
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... npm run dry-run:alerts
```

## Alerting files

Contact points and several notification objects are generated in the classic Grafana alerting provisioning shape.

```sh
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... gcx alert contact-points create -f alerting/contact-point-webhook.json
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... gcx alert contact-points create -f alerting/contact-point-audit.json
GRAFANA_SERVER=https://example.grafana.net GRAFANA_TOKEN=... gcx alert contact-points create -f alerting/contact-point-email.json
```

Use `gcx alert ... --help` for update, export, policy, template, and mute timing commands.

Set `GRAFANA_NAMESPACE`, `GRAFANA_FOLDER_UID`, `GRAFANA_DASHBOARD_FOLDER_UID`, `GRAFANA_TESTDATA_DATASOURCE_UID`, `GRAFANA_ALERT_CONTACT_POINT`, `GRAFANA_EMAIL_CONTACT_POINT`, or `GRAFANA_EMAIL_CONTACT_POINT_ADDRESS` to target another stack or existing folder/contact point.

References:

- https://github.com/grafana/dashboards-as-code-workshop/tree/main/part-one-typescript-starter
- https://github.com/grafana/grafana-foundation-sdk/tree/main/examples/typescript
- https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/api-legacy/alerting_provisioning/
