import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { DEFAULT_PERIOD, sanitizeDashboardName, sectionTitle } from './common';

export interface AlbDashboardProps {
  /**
   * Load balancer full name as used in CloudWatch dimensions,
   * e.g. 'app/my-alb/50dc6c495c0c9188'.
   */
  readonly loadBalancerFullName: string;

  /**
   * Target group full name; enables the healthy/unhealthy host widget.
   * @default - no target health widget
   */
  readonly targetGroupFullName?: string;

  /** @default `alb-<loadBalancerFullName>` (sanitized) */
  readonly dashboardName?: string;
}

/**
 * Operational dashboard for an Application Load Balancer:
 * traffic, response codes (target 2XX/4XX/5XX and ELB 5XX),
 * latency percentiles, connections, and target health.
 */
export class AlbDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: AlbDashboardProps) {
    super(scope, id);

    const lbDimensions = { LoadBalancer: props.loadBalancerFullName };
    const metric = (metricName: string, statistic: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName,
        dimensionsMap: lbDimensions,
        statistic,
        period: DEFAULT_PERIOD,
      });

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName:
        props.dashboardName ??
        sanitizeDashboardName(`alb-${props.loadBalancerFullName}`),
    });

    this.dashboard.addWidgets(
      sectionTitle(`# ALB: ${props.loadBalancerFullName}`),
      new cloudwatch.GraphWidget({
        title: 'Requests',
        left: [metric('RequestCount', cloudwatch.Stats.SUM)],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Response codes',
        left: [
          metric('HTTPCode_Target_2XX_Count', cloudwatch.Stats.SUM),
          metric('HTTPCode_Target_4XX_Count', cloudwatch.Stats.SUM),
          metric('HTTPCode_Target_5XX_Count', cloudwatch.Stats.SUM),
          metric('HTTPCode_ELB_5XX_Count', cloudwatch.Stats.SUM),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Target response time (seconds)',
        left: [
          metric('TargetResponseTime', cloudwatch.Stats.AVERAGE),
          metric('TargetResponseTime', 'p90'),
          metric('TargetResponseTime', 'p99'),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Connections',
        left: [
          metric('ActiveConnectionCount', cloudwatch.Stats.SUM),
          metric('NewConnectionCount', cloudwatch.Stats.SUM),
          metric('RejectedConnectionCount', cloudwatch.Stats.SUM),
        ],
        width: props.targetGroupFullName ? 12 : 24,
      }),
    );

    if (props.targetGroupFullName) {
      const tgDimensions = {
        LoadBalancer: props.loadBalancerFullName,
        TargetGroup: props.targetGroupFullName,
      };
      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Target health',
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'HealthyHostCount',
              dimensionsMap: tgDimensions,
              statistic: cloudwatch.Stats.MINIMUM,
              period: DEFAULT_PERIOD,
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ApplicationELB',
              metricName: 'UnHealthyHostCount',
              dimensionsMap: tgDimensions,
              statistic: cloudwatch.Stats.MAXIMUM,
              period: DEFAULT_PERIOD,
            }),
          ],
          width: 12,
        }),
      );
    }
  }
}
