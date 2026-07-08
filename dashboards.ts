import * as barGauge from "@grafana/grafana-foundation-sdk/bargauge";
import * as dashboardV2 from "@grafana/grafana-foundation-sdk/dashboardv2";
import * as gauge from "@grafana/grafana-foundation-sdk/gauge";
import * as stat from "@grafana/grafana-foundation-sdk/stat";
import * as table from "@grafana/grafana-foundation-sdk/table";
import * as testdata from "@grafana/grafana-foundation-sdk/testdata";
import * as text from "@grafana/grafana-foundation-sdk/text";
import * as timeseries from "@grafana/grafana-foundation-sdk/timeseries";
import { DASHBOARD_FOLDER_UID, TESTDATA_DATASOURCE_NAME } from "./config.ts";
import { manifest, rawBuilder } from "./resource-utils.ts";

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

const { QueryBuilder: TestDataQueryBuilder } = testdata;
const { VisualizationV2Builder: BarGaugeVisualizationBuilder } = barGauge;
const { VisualizationV2Builder: GaugeVisualizationBuilder } = gauge;
const { VisualizationV2Builder: StatVisualizationBuilder } = stat;
const { VisualizationV2Builder: TableVisualizationBuilder } = table;
const { TextMode, VisualizationV2Builder: TextVisualizationBuilder } = text;
const { VisualizationV2Builder: TimeSeriesVisualizationBuilder } = timeseries;

export function operationsDashboard() {
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
          "- `index.ts` defines the generated resource inventory.",
          "- `dashboards.ts` defines dashboard builders and panel helpers.",
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

export function explorationDashboard() {
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
