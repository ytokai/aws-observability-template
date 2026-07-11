import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { DEFAULT_PERIOD, sanitizeDashboardName, sectionTitle } from './common';

export interface CloudFrontDashboardProps {
  /** Distribution to visualize, e.g. 'E1ABCDEF2GHIJK'. */
  readonly distributionId: string;

  /** @default `cloudfront-<distributionId>` */
  readonly dashboardName?: string;
}

/**
 * Operational dashboard for a CloudFront distribution.
 *
 * CloudFront is a global service: its metrics are published to
 * US East (N. Virginia), so every widget pins `region: 'us-east-1'`
 * regardless of the stack's region.
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/monitoring-using-cloudwatch.html
 */
export class CloudFrontDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: CloudFrontDashboardProps) {
    super(scope, id);

    const metric = (metricName: string, statistic: string): cloudwatch.Metric =>
      new cloudwatch.Metric({
        namespace: 'AWS/CloudFront',
        metricName,
        dimensionsMap: {
          DistributionId: props.distributionId,
          Region: 'Global',
        },
        statistic,
        period: DEFAULT_PERIOD,
        region: 'us-east-1', // CloudFront metrics live in us-east-1
      });

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName:
        props.dashboardName ??
        sanitizeDashboardName(`cloudfront-${props.distributionId}`),
    });

    this.dashboard.addWidgets(
      sectionTitle(`# CloudFront: ${props.distributionId}`),
      new cloudwatch.GraphWidget({
        title: 'Requests',
        left: [metric('Requests', cloudwatch.Stats.SUM)],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Error rate (%)',
        left: [
          metric('TotalErrorRate', cloudwatch.Stats.AVERAGE),
          metric('4xxErrorRate', cloudwatch.Stats.AVERAGE),
          metric('5xxErrorRate', cloudwatch.Stats.AVERAGE),
        ],
        leftYAxis: { min: 0, max: 100 },
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Data transfer (bytes)',
        left: [
          metric('BytesDownloaded', cloudwatch.Stats.SUM),
          metric('BytesUploaded', cloudwatch.Stats.SUM),
        ],
        width: 8,
      }),
    );
  }
}
