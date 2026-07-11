import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { DEFAULT_PERIOD, sanitizeDashboardName, sectionTitle } from './common';

export interface LambdaDashboardProps {
  /** Function to visualize (name, not ARN). */
  readonly functionName: string;

  /** @default `lambda-<functionName>` */
  readonly dashboardName?: string;
}

/**
 * Operational dashboard for a Lambda function:
 * traffic (invocations/errors + error rate), latency (avg/p90/p99),
 * and saturation (throttles, concurrent executions).
 */
export class LambdaDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: LambdaDashboardProps) {
    super(scope, id);

    const dimensionsMap = { FunctionName: props.functionName };
    const metric = (metricName: string, statistic: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName,
        dimensionsMap,
        statistic,
        period: DEFAULT_PERIOD,
      });

    const invocations = metric('Invocations', cloudwatch.Stats.SUM);
    const errors = metric('Errors', cloudwatch.Stats.SUM);

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName:
        props.dashboardName ??
        sanitizeDashboardName(`lambda-${props.functionName}`),
    });

    this.dashboard.addWidgets(
      sectionTitle(`# Lambda: ${props.functionName}`),
      new cloudwatch.GraphWidget({
        title: 'Invocations & Errors',
        left: [invocations, errors],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Error rate (%)',
        left: [
          new cloudwatch.MathExpression({
            expression: '100 * errors / MAX([errors, invocations])',
            usingMetrics: { errors, invocations },
            label: 'Error rate',
            period: DEFAULT_PERIOD,
          }),
        ],
        leftYAxis: { min: 0, max: 100 },
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Duration (ms)',
        left: [
          metric('Duration', cloudwatch.Stats.AVERAGE),
          metric('Duration', 'p90'),
          metric('Duration', 'p99'),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Throttles',
        left: [metric('Throttles', cloudwatch.Stats.SUM)],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Concurrent executions',
        left: [metric('ConcurrentExecutions', cloudwatch.Stats.MAXIMUM)],
        width: 12,
      }),
    );
  }
}
