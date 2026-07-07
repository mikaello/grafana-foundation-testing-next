import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import * as alerting from "@grafana/grafana-foundation-sdk/alerting";
import * as barGauge from "@grafana/grafana-foundation-sdk/bargauge";
import * as dashboardV2 from "@grafana/grafana-foundation-sdk/dashboardv2";
import * as folderV1 from "@grafana/grafana-foundation-sdk/folderv1";
import * as gauge from "@grafana/grafana-foundation-sdk/gauge";
import * as resource from "@grafana/grafana-foundation-sdk/resource";
import * as stat from "@grafana/grafana-foundation-sdk/stat";
import * as table from "@grafana/grafana-foundation-sdk/table";
import * as testdata from "@grafana/grafana-foundation-sdk/testdata";
import * as text from "@grafana/grafana-foundation-sdk/text";
import * as timeseries from "@grafana/grafana-foundation-sdk/timeseries";

const {
  AutoGridBuilder,
  DashboardBuilder,
  GridBuilder,
  GridItemBuilder,
  IntervalVariableBuilder,
  PanelBuilder,
  QueryGroupBuilder,
  RowBuilder,
  RowsBuilder,
  TabBuilder,
  TabsBuilder,
  TargetBuilder,
  TimeSettingsBuilder,
} = dashboardV2;

const {
  ContactPointBuilder,
  MuteTimingBuilder,
  NotificationPolicyBuilder,
  NotificationSettingsBuilder,
  NotificationTemplateBuilder,
  QueryBuilder: AlertQueryBuilder,
  RuleBuilder,
  RuleGroupBuilder,
  TimeIntervalBuilder,
  TimeRangeBuilder,
  WeekdayRangeBuilder,
} = alerting;

const { FolderBuilder } = folderV1;
const { ManifestBuilder, MetadataBuilder } = resource;
const { QueryBuilder: TestDataQueryBuilder } = testdata;
const { VisualizationV2Builder: BarGaugeVisualizationBuilder } = barGauge;
const { VisualizationV2Builder: GaugeVisualizationBuilder } = gauge;
const { VisualizationV2Builder: StatVisualizationBuilder } = stat;
const { VisualizationV2Builder: TableVisualizationBuilder } = table;
const { TextMode, VisualizationV2Builder: TextVisualizationBuilder } = text;
const { VisualizationV2Builder: TimeSeriesVisualizationBuilder } = timeseries;

const TESTDATA_DATASOURCE_NAME = "grafana-testdata-datasource";
const TESTDATA_DATASOURCE_UID =
  process.env.GRAFANA_TESTDATA_DATASOURCE_UID ?? TESTDATA_DATASOURCE_NAME;
const GRAFANA_NAMESPACE = process.env.GRAFANA_NAMESPACE ?? "stacks-1030830";
const FOLDER_UID = process.env.GRAFANA_FOLDER_UID ?? "grafana-as-code-lab";
const FOLDER_TITLE = process.env.GRAFANA_FOLDER_TITLE ?? "Grafana as Code Lab";
const DASHBOARD_FOLDER_UID = process.env.GRAFANA_DASHBOARD_FOLDER_UID ?? "";
const ALERT_CONTACT_POINT =
  process.env.GRAFANA_ALERT_CONTACT_POINT ?? "grafana-as-code-webhook";

type JsonObject = Record<string, unknown>;

function prepareGeneratedDirectories() {
  for (const directory of ["resources", "alerting-resources", "alerting"]) {
    rmSync(directory, { recursive: true, force: true });
    mkdirSync(directory, { recursive: true });
  }
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
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

function manifest(
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

function dashboardAnnotations() {
  return DASHBOARD_FOLDER_UID === ""
    ? {}
    : {
        "grafana.app/folder": DASHBOARD_FOLDER_UID,
      };
}

function testDataQuery(
  scenarioId: testdata.dataquery["scenarioId"],
  options: Partial<testdata.dataquery> = {},
) {
  const builder = new TestDataQueryBuilder()
    .datasource({ name: TESTDATA_DATASOURCE_NAME })
    .scenarioId(scenarioId);

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && key in builder) {
      Reflect.apply(
        builder[key as keyof TestDataQueryBuilder] as (
          nextValue: unknown,
        ) => TestDataQueryBuilder,
        builder,
        [value],
      );
    }
  }

  return builder;
}

function panel(
  id: number,
  title: string,
  query: TestDataQueryBuilder,
  visualization: { build(): dashboardV2.VizConfigKind },
  description = "",
) {
  return new PanelBuilder()
    .id(id)
    .title(title)
    .description(description)
    .data(
      new QueryGroupBuilder().target(
        new TargetBuilder().refId("A").query(query),
      ),
    )
    .visualization(visualization);
}

function textPanel(id: number, title: string, content: string) {
  return new PanelBuilder()
    .id(id)
    .title(title)
    .data(new QueryGroupBuilder())
    .visualization(
      new TextVisualizationBuilder().mode(TextMode.Markdown).content(content),
    );
}

function gridItem(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return new GridItemBuilder().name(name).x(x).y(y).width(width).height(height);
}

function dashboardTimeSettings() {
  return new TimeSettingsBuilder()
    .from("now-6h")
    .to("now")
    .autoRefresh("30s")
    .autoRefreshIntervals(["10s", "30s", "1m", "5m", "15m", "1h"])
    .weekStart("monday");
}

function intervalVariable() {
  return new IntervalVariableBuilder("interval")
    .label("Interval")
    .query("1m,5m,15m,1h,6h")
    .current({ text: "5m", value: "5m", selected: true })
    .options([
      { text: "1m", value: "1m" },
      { text: "5m", value: "5m", selected: true },
      { text: "15m", value: "15m" },
      { text: "1h", value: "1h" },
      { text: "6h", value: "6h" },
    ]);
}

function operationsDashboard() {
  const dashboard = new DashboardBuilder("[as-code] Operations Overview")
    .description(
      "Dashboard V2 generated from TypeScript with testdata panels, variables, grid layout, and mixed visualizations.",
    )
    .tags(["as-code", "dashboard-v2", "gcx", "testdata"])
    .editable(true)
    .preload(true)
    .timeSettings(dashboardTimeSettings())
    .variable(intervalVariable())
    .element(
      "overview-notes",
      textPanel(
        1,
        "How this dashboard is built",
        [
          "This panel is generated with the Dashboard V2 SDK.",
          "",
          "- `index.ts` defines builders for dashboards, panels, alert rules, and contact points.",
          "- `npm run build` emits Kubernetes-style manifests for `gcx resources`.",
          "- The data source is Grafana's built-in testdata plugin so the example is portable.",
        ].join("\n"),
      ),
    )
    .element(
      "availability-stat",
      panel(
        2,
        "Availability",
        testDataQuery("random_walk", {
          max: 1,
          min: 0.965,
          seriesCount: 1,
          spread: 0.01,
        }),
        new StatVisualizationBuilder()
          .unit("percentunit")
          .decimals(2)
          .min(0.95)
          .max(1)
          .graphMode("area")
          .colorMode("background")
          .textMode("value_and_name"),
      ),
    )
    .element(
      "error-budget-gauge",
      panel(
        3,
        "Error budget remaining",
        testDataQuery("random_walk", {
          max: 100,
          min: 55,
          seriesCount: 1,
          spread: 15,
        }),
        new GaugeVisualizationBuilder()
          .unit("percent")
          .decimals(1)
          .min(0)
          .max(100)
          .showThresholdLabels(true)
          .showThresholdMarkers(true),
      ),
    )
    .element(
      "latency-timeseries",
      panel(
        4,
        "Latency by endpoint",
        testDataQuery("random_walk", {
          max: 280,
          min: 35,
          seriesCount: 5,
          spread: 65,
        }),
        new TimeSeriesVisualizationBuilder()
          .unit("ms")
          .decimals(0)
          .legend({
            build: () => ({ displayMode: "table", placement: "right" }),
          })
          .tooltip({ build: () => ({ mode: "multi", sort: "desc" }) })
          .drawStyle("line")
          .fillOpacity(18)
          .lineWidth(2)
          .axisLabel("p95 latency"),
      ),
    )
    .element(
      "saturation-bars",
      panel(
        5,
        "Capacity saturation",
        testDataQuery("random_walk", {
          max: 100,
          min: 15,
          seriesCount: 6,
          spread: 35,
        }),
        new BarGaugeVisualizationBuilder()
          .unit("percent")
          .decimals(0)
          .min(0)
          .max(100)
          .displayMode("gradient")
          .showUnfilled(true),
      ),
    )
    .element(
      "release-table",
      panel(
        6,
        "Release signals table",
        testDataQuery("random_walk_table", {
          seriesCount: 8,
        }),
        new TableVisualizationBuilder()
          .showHeader(true)
          .showTypeIcons(true)
          .cellHeight("sm")
          .filterable(true),
      ),
    )
    .layout(
      new GridBuilder()
        .item(gridItem("overview-notes", 0, 0, 8, 5))
        .item(gridItem("availability-stat", 8, 0, 4, 5))
        .item(gridItem("error-budget-gauge", 12, 0, 4, 5))
        .item(gridItem("saturation-bars", 16, 0, 8, 5))
        .item(gridItem("latency-timeseries", 0, 5, 16, 9))
        .item(gridItem("release-table", 16, 5, 8, 9)),
    );

  return manifest(
    "dashboard.grafana.app/v2",
    "Dashboard",
    "grafana-as-code-operations-overview",
    dashboard.build(),
    dashboardAnnotations(),
    {
      "grafana-as-code/example": "operations-overview",
    },
  );
}

function explorationDashboard() {
  const dashboard = new DashboardBuilder("[as-code] Layout Exploration")
    .description(
      "Dashboard V2 generated with tabs, rows, autogrid, and varied testdata scenarios.",
    )
    .tags(["as-code", "dashboard-v2", "tabs", "rows"])
    .editable(true)
    .preload(false)
    .timeSettings(dashboardTimeSettings())
    .element(
      "random-walk",
      panel(
        10,
        "Random walk",
        testDataQuery("random_walk", {
          seriesCount: 4,
          spread: 45,
        }),
        new TimeSeriesVisualizationBuilder().unit("short").legend({
          build: () => ({ displayMode: "list", placement: "bottom" }),
        }),
      ),
    )
    .element(
      "csv-wave",
      panel(
        11,
        "Predictable wave",
        testDataQuery("predictable_csv_wave", {
          csvWave: [
            rawBuilder({
              name: "blue",
              timeStep: 60,
              valuesCSV: "10,20,30,55,40,30,20,10",
            }),
            rawBuilder({
              name: "green",
              timeStep: 60,
              valuesCSV: "40,30,20,10,20,35,50,65",
            }),
          ],
        }),
        new TimeSeriesVisualizationBuilder()
          .unit("short")
          .lineInterpolation("smooth")
          .fillOpacity(10),
      ),
    )
    .element(
      "logs-table",
      panel(
        12,
        "Synthetic logs",
        testDataQuery("logs", {
          levelColumn: true,
          lines: 25,
        }),
        new TableVisualizationBuilder()
          .showHeader(true)
          .showTypeIcons(true)
          .cellHeight("md")
          .filterable(true),
      ),
    )
    .element(
      "trace-summary",
      panel(
        13,
        "Trace span count",
        testDataQuery("trace", {
          spanCount: 12,
        }),
        new StatVisualizationBuilder()
          .unit("short")
          .decimals(0)
          .graphMode("none")
          .colorMode("value"),
      ),
    )
    .element(
      "state-map",
      panel(
        14,
        "USA sample data",
        testDataQuery("usa", {
          usa: rawBuilder({
            fields: ["state", "value"],
            mode: "states",
            period: "hour",
          }),
        }),
        new TableVisualizationBuilder()
          .showHeader(true)
          .cellHeight("sm")
          .filterable(true),
      ),
    )
    .layout(
      new TabsBuilder()
        .tab(
          new TabBuilder()
            .title("Signals")
            .layout(
              new RowsBuilder()
                .row(
                  new RowBuilder()
                    .title("Time series")
                    .layout(
                      new AutoGridBuilder()
                        .maxColumnCount(2)
                        .columnWidthMode("wide")
                        .rowHeightMode("tall")
                        .withItem("random-walk")
                        .withItem("csv-wave"),
                    ),
                )
                .row(
                  new RowBuilder()
                    .title("Events")
                    .layout(
                      new AutoGridBuilder()
                        .maxColumnCount(2)
                        .columnWidthMode("wide")
                        .rowHeightMode("standard")
                        .withItem("logs-table")
                        .withItem("trace-summary"),
                    ),
                ),
            ),
        )
        .tab(
          new TabBuilder()
            .title("Tables")
            .layout(
              new GridBuilder().item(gridItem("state-map", 0, 0, 24, 12)),
            ),
        ),
    );

  return manifest(
    "dashboard.grafana.app/v2",
    "Dashboard",
    "grafana-as-code-layout-exploration",
    dashboard.build(),
    dashboardAnnotations(),
    {
      "grafana-as-code/example": "layout-exploration",
    },
  );
}

function folderResource() {
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

function expressionQuery(
  refId: string,
  model: JsonObject,
  datasourceUid: string,
  source: boolean,
) {
  return {
    datasource_uid: datasourceUid,
    model,
    query_type: "",
    ref_id: refId,
    relative_time_range: {
      from: "600s",
      to: "0s",
    },
    source,
  };
}

function thresholdExpression(
  refId: string,
  expression: string,
  threshold: number,
) {
  return expressionQuery(
    refId,
    {
      conditions: [
        {
          evaluator: {
            params: [threshold],
            type: "gt",
          },
          operator: {
            type: "and",
          },
          query: {
            params: [expression],
          },
          reducer: {
            params: [],
            type: "last",
          },
          type: "query",
        },
      ],
      datasource: {
        type: "__expr__",
        uid: "__expr__",
      },
      expression,
      intervalMs: 1000,
      maxDataPoints: 43200,
      refId,
      type: "threshold",
    },
    "__expr__",
    false,
  );
}

function alertRuleResource(
  name: string,
  title: string,
  queryModel: JsonObject,
  threshold: number,
  severity: "warning" | "critical",
) {
  return manifest(
    "rules.alerting.grafana.app/v0alpha1",
    "AlertRule",
    name,
    {
      annotations: {
        description:
          "Example paused alert rule generated as code with gcx resources.",
        runbook_url: "https://example.com/runbooks/grafana-as-code",
        summary: `${title} crossed its synthetic threshold.`,
      },
      execErrState: "KeepLast",
      expressions: {
        A: expressionQuery("A", queryModel, TESTDATA_DATASOURCE_UID, true),
        B: thresholdExpression("B", "A", threshold),
      },
      for: severity === "critical" ? "1m" : "3m",
      keepFiringFor: "5m",
      labels: {
        managed_by: "gcx",
        severity,
        team: "platform",
      },
      missingSeriesEvalsToResolve: 3,
      noDataState: "KeepLast",
      notificationSettings: {
        receiver: ALERT_CONTACT_POINT,
      },
      paused: true,
      title,
      trigger: {
        interval: severity === "critical" ? "30s" : "1m",
      },
    },
    {
      "grafana.app/folder": FOLDER_UID,
    },
    {
      "grafana-as-code/example": "alert-rule",
    },
  );
}

function alertRuleResources() {
  return [
    alertRuleResource(
      "grafana-as-code-latency-warning",
      "[as-code] Synthetic latency warning",
      {
        datasource: {
          type: TESTDATA_DATASOURCE_NAME,
          uid: TESTDATA_DATASOURCE_UID,
        },
        refId: "A",
        scenarioId: "random_walk",
        seriesCount: 1,
      },
      80,
      "warning",
    ),
    alertRuleResource(
      "grafana-as-code-error-budget-critical",
      "[as-code] Synthetic error budget critical",
      {
        datasource: {
          type: TESTDATA_DATASOURCE_NAME,
          uid: TESTDATA_DATASOURCE_UID,
        },
        max: 100,
        min: 0,
        refId: "A",
        scenarioId: "random_walk",
        seriesCount: 1,
      },
      95,
      "critical",
    ),
  ];
}

function rawBuilder<T>(value: T) {
  return {
    build: () => value,
  };
}

function classicAlertRuleGroup() {
  const testDataModel = rawBuilder({
    datasource: {
      type: TESTDATA_DATASOURCE_NAME,
      uid: TESTDATA_DATASOURCE_UID,
    },
    refId: "A",
    scenarioId: "random_walk",
    seriesCount: 1,
  });

  const thresholdModel = rawBuilder({
    conditions: [
      {
        evaluator: {
          params: [80],
          type: "gt",
        },
        operator: {
          type: "and",
        },
        query: {
          params: ["A"],
        },
        reducer: {
          params: [],
          type: "last",
        },
        type: "query",
      },
    ],
    datasource: {
      type: "__expr__",
      uid: "__expr__",
    },
    expression: "A",
    intervalMs: 1000,
    maxDataPoints: 43200,
    refId: "B",
    type: "threshold",
  });

  return new RuleGroupBuilder("grafana-as-code-classic")
    .folderUid(FOLDER_UID)
    .interval(60)
    .withRule(
      new RuleBuilder("[classic] Synthetic latency warning")
        .uid("gac-classic-latency-warning")
        .folderUID(FOLDER_UID)
        .ruleGroup("grafana-as-code-classic")
        .orgID(1)
        .condition("B")
        .forDuration("3m")
        .keepFiringFor(300)
        .noDataState("KeepLast")
        .execErrState("KeepLast")
        .isPaused(true)
        .labels({
          managed_by: "gcx",
          severity: "warning",
          team: "platform",
        })
        .annotations({
          runbook_url: "https://example.com/runbooks/grafana-as-code",
          summary: "Classic provisioning format alert rule example.",
        })
        .notificationSettings(
          new NotificationSettingsBuilder()
            .receiver(ALERT_CONTACT_POINT)
            .groupBy(["alertname", "severity", "team"])
            .groupWait("30s")
            .groupInterval("5m")
            .repeatInterval("4h")
            .muteTimeIntervals(["grafana-as-code-maintenance"]),
        )
        .withQuery(
          new AlertQueryBuilder("A")
            .datasourceUid(TESTDATA_DATASOURCE_UID)
            .model(testDataModel)
            .relativeTimeRange({
              from: 600,
              to: 0,
            }),
        )
        .withQuery(
          new AlertQueryBuilder("B")
            .datasourceUid("__expr__")
            .model(thresholdModel)
            .relativeTimeRange({
              from: 0,
              to: 0,
            }),
        ),
    )
    .build();
}

function alertingProvisioningResources() {
  const webhookContactPoint = new ContactPointBuilder()
    .uid("gac-webhook")
    .name(ALERT_CONTACT_POINT)
    .type("webhook")
    .disableResolveMessage(false)
    .settings({
      httpMethod: "POST",
      maxAlerts: "10",
      title: '{{ template "grafana-as-code.title" . }}',
      url: "https://example.invalid/grafana-as-code-webhook",
    })
    .build();

  const auditContactPoint = new ContactPointBuilder()
    .uid("gac-audit-webhook")
    .name("grafana-as-code-audit-webhook")
    .type("webhook")
    .disableResolveMessage(true)
    .settings({
      httpMethod: "POST",
      maxAlerts: "25",
      title: "Grafana as Code audit notification",
      url: "https://example.invalid/grafana-as-code-audit",
    })
    .build();

  const notificationPolicy = new NotificationPolicyBuilder()
    .receiver(ALERT_CONTACT_POINT)
    .groupBy(["grafana_folder", "alertname", "severity"])
    .groupWait("30s")
    .groupInterval("5m")
    .repeatInterval("4h")
    .routes([
      new NotificationPolicyBuilder()
        .receiver("grafana-as-code-audit-webhook")
        .objectMatchers([
          ["team", "=", "platform"],
          ["severity", "=", "critical"],
        ])
        .groupBy(["alertname"])
        .groupWait("10s")
        .repeatInterval("1h"),
    ])
    .build();

  const maintenanceWindow = new MuteTimingBuilder()
    .name("grafana-as-code-maintenance")
    .timeIntervals([
      new TimeIntervalBuilder()
        .location("Europe/Oslo")
        .weekdays([new WeekdayRangeBuilder().begin(6).end(7)])
        .times([new TimeRangeBuilder().from("22:00").to("23:59")]),
    ])
    .build();

  const template = new NotificationTemplateBuilder()
    .name("grafana-as-code")
    .template(
      [
        '{{ define "grafana-as-code.title" }}',
        "[{{ .Status | toUpper }}] {{ len .Alerts }} Grafana as Code alert(s)",
        "{{ end }}",
        "",
        '{{ define "grafana-as-code.message" }}',
        "{{ range .Alerts }}",
        "- {{ .Labels.alertname }} severity={{ .Labels.severity }}",
        "{{ end }}",
        "{{ end }}",
      ].join("\n"),
    )
    .build();

  return {
    auditContactPoint,
    classicAlertRuleGroup: classicAlertRuleGroup(),
    maintenanceWindow,
    notificationPolicy,
    template,
    webhookContactPoint,
  };
}

prepareGeneratedDirectories();

writeJson("resources/00-folder.json", folderResource());
writeJson(
  "resources/10-dashboard-operations-overview.json",
  operationsDashboard(),
);
writeJson(
  "resources/11-dashboard-layout-exploration.json",
  explorationDashboard(),
);

for (const [index, alertRule] of alertRuleResources().entries()) {
  writeJson(
    `alerting-resources/${String(index + 10).padStart(2, "0")}-${alertRule.metadata.name}.json`,
    alertRule,
  );
}

const alertingResources = alertingProvisioningResources();
writeJson(
  "alerting/contact-point-webhook.json",
  alertingResources.webhookContactPoint,
);
writeJson(
  "alerting/contact-point-audit.json",
  alertingResources.auditContactPoint,
);
writeJson(
  "alerting/notification-policy.json",
  alertingResources.notificationPolicy,
);
writeJson(
  "alerting/mute-timing-maintenance.json",
  alertingResources.maintenanceWindow,
);
writeJson("alerting/notification-template.json", alertingResources.template);
writeJson(
  "alerting/classic-rule-group.json",
  alertingResources.classicAlertRuleGroup,
);
