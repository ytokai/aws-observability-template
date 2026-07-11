import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { DEFAULT_PERIOD, sanitizeDashboardName, sectionTitle } from './common';

export interface AuroraDashboardProps {
  /** Aurora cluster to visualize. */
  readonly dbClusterIdentifier: string;

  /** @default `aurora-<dbClusterIdentifier>` */
  readonly dashboardName?: string;
}

/**
 * Operational dashboard for an Aurora cluster:
 * CPU, connections, freeable memory, read/write latency, and
 * cluster volume usage. Metrics use the DBClusterIdentifier
 * dimension (aggregated across instances in the cluster).
 */
export class AuroraDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: AuroraDashboardProps) {
    super(scope, id);

    const dimensionsMap = { DBClusterIdentifier: props.dbClusterIdentifier };
    const metric = (metricName: string, statistic: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName,
        dimensionsMap,
        statistic,
        period: DEFAULT_PERIOD,
      });

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName:
        props.dashboardName ??
        sanitizeDashboardName(`aurora-${props.dbClusterIdentifier}`),
    });

    this.dashboard.addWidgets(
      sectionTitle(`# Aurora: ${props.dbClusterIdentifier}`),
      new cloudwatch.GraphWidget({
        title: 'CPU utilization (%)',
        left: [
          metric('CPUUtilization', cloudwatch.Stats.AVERAGE),
          metric('CPUUtilization', cloudwatch.Stats.MAXIMUM),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database connections',
        left: [metric('DatabaseConnections', cloudwatch.Stats.AVERAGE)],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Freeable memory (bytes)',
        left: [metric('FreeableMemory', cloudwatch.Stats.MINIMUM)],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Read / Write latency (p90, seconds)',
        left: [metric('ReadLatency', 'p90'), metric('WriteLatency', 'p90')],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Cluster volume used (bytes)',
        left: [metric('VolumeBytesUsed', cloudwatch.Stats.AVERAGE)],
        width: 12,
      }),
    );
  }
}
