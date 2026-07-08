import * as alerting from "@grafana/grafana-foundation-sdk/alerting";
import {
  ALERT_CONTACT_POINT,
  FOLDER_UID,
  type JsonObject,
  TESTDATA_DATASOURCE_NAME,
  TESTDATA_DATASOURCE_UID,
} from "./config.ts";
import { manifest, rawBuilder } from "./resource-utils.ts";

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

export function alertRuleResources() {
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

export function alertingProvisioningResources() {
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
