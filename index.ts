import * as dashboardV2Beta1 from "@grafana/grafana-foundation-sdk/dashboardv2beta1";
import * as resource from "@grafana/grafana-foundation-sdk/resource";
import * as testdata from "@grafana/grafana-foundation-sdk/testdata";
import * as timeseries from "@grafana/grafana-foundation-sdk/timeseries";

const {
  AutoGridBuilder,
  AutoGridItemBuilder,
  DashboardBuilder,
  GridBuilder,
  GridItemBuilder,
  PanelBuilder,
  QueryGroupBuilder,
  RowBuilder,
  RowsBuilder,
  TabBuilder,
  TabsBuilder,
  TargetBuilder,
} = dashboardV2Beta1;

const { DashboardKind, ManifestBuilder, MetadataBuilder } = resource;
const { QueryBuilder: TestDataQueryBuilder } = testdata;
const { VisualizationBuilder: TimeSeriesVisualizationBuilder } = timeseries;

const TESTDATA_DATASOURCE_NAME = "grafana-testdata-datasource";
const DASHBOARD_API_VERSION = "dashboard.grafana.app/v2";
const GRAFANA_NAMESPACE = process.env.GRAFANA_NAMESPACE ?? "stacks-1030830";

function randomWalkPanel(panelId: number, seriesCount: number) {
  return new PanelBuilder()
    .id(panelId)
    .title(`New panel ${panelId}`)
    .data(
      new QueryGroupBuilder().target(
        new TargetBuilder()
          .refId("A")
          .query(
            new TestDataQueryBuilder()
              .datasource({ name: TESTDATA_DATASOURCE_NAME })
              .scenarioId("random_walk")
              .seriesCount(seriesCount),
          ),
      ),
    )
    .visualization(new TimeSeriesVisualizationBuilder());
}

const dashboard = new DashboardBuilder("[Example] Dashboard with tabs and rows")
  .description(
    "Dashboard with tabs and rows generated with grafana-foundation-sdk",
  )
  .element("panel-1", randomWalkPanel(1, 4))
  .element("panel-2", randomWalkPanel(2, 5))
  .element("panel-3", randomWalkPanel(3, 1))
  .element("panel-4", randomWalkPanel(4, 1))
  .layout(
    new TabsBuilder()
      .tab(
        new TabBuilder()
          .title("Tab without rows")
          .layout(
            new GridBuilder().item(
              new GridItemBuilder("panel-1").width(12).height(8),
            ),
          ),
      )
      .tab(
        new TabBuilder().title("Tab With Rows").layout(
          new RowsBuilder()
            .row(
              new RowBuilder()
                .title("Row without tabs")
                .collapse(true)
                .layout(
                  new AutoGridBuilder().item(
                    new AutoGridItemBuilder("panel-2"),
                  ),
                ),
            )
            .row(
              new RowBuilder()
                .title("Row with tabs")
                .collapse(true)
                .layout(
                  new AutoGridBuilder()
                    .item(new AutoGridItemBuilder("panel-3"))
                    .item(new AutoGridItemBuilder("panel-4")),
                ),
            )
            .row(
              new RowBuilder().title("Empty row").layout(new AutoGridBuilder()),
            )
            .row(
              new RowBuilder()
                .title("Hide header row")
                .hideHeader(true)
                .layout(new AutoGridBuilder()),
            ),
        ),
      ),
  );

const dashboardManifest = new ManifestBuilder()
  .apiVersion(DASHBOARD_API_VERSION)
  .kind(DashboardKind)
  .metadata(
    new MetadataBuilder()
      .name("example-dashboard-with-tabs-and-rows")
      .namespace(GRAFANA_NAMESPACE)
      .annotations({
        "grafana.app/folder": "",
      }),
  )
  .spec(dashboard.build());

console.log(JSON.stringify(dashboardManifest.build(), null, 2));
