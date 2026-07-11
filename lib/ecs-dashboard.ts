import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { DEFAULT_PERIOD, sanitizeDashboardName, sectionTitle } from './common';

export interface EcsServiceDashboardProps {
  /** Cluster the service runs in. */
  readonly clusterName: string;

  /** Service to visualize. */
  readonly serviceName: string;

  /**
   * Include the RunningTaskCount widget.
   * Requires Container Insights on the cluster.
   * @default false
   */
  readonly containerInsights?: boolean;

  /** @default `ecs-<clusterName>-<serviceName>` */
  readonly dashboardName?: string;
}

/**
 * Operational dashboard for an ECS service:
 * CPU/memory utilization (average and max) and, with Container
 * Insights enabled, the running task count.
 */
export class EcsServiceDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: EcsServiceDashboardProps) {
    super(scope, id);

    const dimensionsMap = {
      ClusterName: props.clusterName,
      ServiceName: props.serviceName,
    };
    const metric = (metricName: string, statistic: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName,
        dimensionsMap,
        statistic,
        period: DEFAULT_PERIOD,
      });

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName:
        props.dashboardName ??
        sanitizeDashboardName(`ecs-${props.clusterName}-${props.serviceName}`),
    });

    this.dashboard.addWidgets(
      sectionTitle(`# ECS: ${props.clusterName} / ${props.serviceName}`),
      new cloudwatch.GraphWidget({
        title: 'CPU utilization (%)',
        left: [
          metric('CPUUtilization', cloudwatch.Stats.AVERAGE),
          metric('CPUUtilization', cloudwatch.Stats.MAXIMUM),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Memory utilization (%)',
        left: [
          metric('MemoryUtilization', cloudwatch.Stats.AVERAGE),
          metric('MemoryUtilization', cloudwatch.Stats.MAXIMUM),
        ],
        width: 12,
      }),
    );

    if (props.containerInsights) {
      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Running tasks (Container Insights)',
          left: [
            new cloudwatch.Metric({
              namespace: 'ECS/ContainerInsights',
              metricName: 'RunningTaskCount',
              dimensionsMap,
              statistic: cloudwatch.Stats.MINIMUM,
              period: DEFAULT_PERIOD,
            }),
          ],
          width: 24,
        }),
      );
    }
  }
}
