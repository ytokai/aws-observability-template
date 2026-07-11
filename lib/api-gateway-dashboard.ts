import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { DEFAULT_PERIOD, sanitizeDashboardName, sectionTitle } from './common';

export interface ApiGatewayDashboardProps {
  /** REST API name as shown in the console. */
  readonly apiName: string;

  /** Stage to visualize, e.g. 'prod'. */
  readonly stage: string;

  /** @default `apigw-<apiName>-<stage>` */
  readonly dashboardName?: string;
}

/**
 * Operational dashboard for an API Gateway REST API stage:
 * request count, client/server error rates, and latency percentiles
 * split into API Gateway overhead vs backend (IntegrationLatency).
 */
export class ApiGatewayDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ApiGatewayDashboardProps) {
    super(scope, id);

    const dimensionsMap = { ApiName: props.apiName, Stage: props.stage };
    const metric = (metricName: string, statistic: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName,
        dimensionsMap,
        statistic,
        period: DEFAULT_PERIOD,
      });

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName:
        props.dashboardName ??
        sanitizeDashboardName(`apigw-${props.apiName}-${props.stage}`),
    });

    this.dashboard.addWidgets(
      sectionTitle(`# API Gateway: ${props.apiName} (${props.stage})`),
      new cloudwatch.GraphWidget({
        title: 'Requests',
        left: [metric('Count', cloudwatch.Stats.SAMPLE_COUNT)],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Error rate (%) - 4XX / 5XX',
        left: [
          new cloudwatch.MathExpression({
            expression: '100 * e4',
            usingMetrics: { e4: metric('4XXError', cloudwatch.Stats.AVERAGE) },
            label: '4XX rate',
            period: DEFAULT_PERIOD,
          }),
          new cloudwatch.MathExpression({
            expression: '100 * e5',
            usingMetrics: { e5: metric('5XXError', cloudwatch.Stats.AVERAGE) },
            label: '5XX rate',
            period: DEFAULT_PERIOD,
          }),
        ],
        leftYAxis: { min: 0, max: 100 },
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Latency (ms)',
        left: [
          metric('Latency', 'p50'),
          metric('Latency', 'p90'),
          metric('Latency', 'p99'),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Integration latency vs total (p90, ms)',
        left: [metric('Latency', 'p90'), metric('IntegrationLatency', 'p90')],
        width: 24,
      }),
    );
  }
}
