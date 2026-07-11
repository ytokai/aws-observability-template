import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

/** Default period used by every widget in this library. */
export const DEFAULT_PERIOD = cdk.Duration.minutes(5);

/**
 * CloudWatch dashboard names only allow [A-Za-z0-9_-].
 * Turns arbitrary identifiers (e.g. 'app/my-alb/123') into a safe name.
 */
export function sanitizeDashboardName(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]/g, '-');
}

/** Section header rendered above each widget group. */
export function sectionTitle(markdown: string): cloudwatch.TextWidget {
  return new cloudwatch.TextWidget({
    markdown,
    width: 24,
    height: 1,
  });
}
