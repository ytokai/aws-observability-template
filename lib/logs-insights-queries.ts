import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface LogsInsightsQueriesProps {
  /**
   * Prefix for the saved query names so they group together
   * in the Logs Insights console.
   * @default 'observability-template'
   */
  readonly queryPrefix?: string;
}

/**
 * A starter set of saved CloudWatch Logs Insights queries for
 * day-to-day operations and incident response. Saved queries are
 * account-wide: pick any log group when running them.
 */
export class LogsInsightsQueries extends Construct {
  public readonly queries: logs.QueryDefinition[] = [];

  constructor(
    scope: Construct,
    id: string,
    props: LogsInsightsQueriesProps = {},
  ) {
    super(scope, id);

    const prefix = props.queryPrefix ?? 'observability-template';

    const define = (
      constructId: string,
      name: string,
      queryString: logs.QueryString,
    ): void => {
      this.queries.push(
        new logs.QueryDefinition(this, constructId, {
          queryDefinitionName: `${prefix}/${name}`,
          queryString,
        }),
      );
    };

    define(
      'RecentErrors',
      'recent-errors',
      new logs.QueryString({
        fields: ['@timestamp', '@logStream', '@message'],
        filterStatements: ['@message like /(?i)(error|exception|fail)/'],
        sort: '@timestamp desc',
        limit: 100,
      }),
    );

    define(
      'TopErrorMessages',
      'top-error-messages',
      new logs.QueryString({
        filterStatements: ['@message like /(?i)(error|exception)/'],
        stats: 'count(*) as occurrences by @message',
        sort: 'occurrences desc',
        limit: 25,
      }),
    );

    define(
      'LambdaSlowestInvocations',
      'lambda-slowest-invocations',
      new logs.QueryString({
        fields: ['@timestamp', '@requestId', '@duration', '@maxMemoryUsed'],
        filterStatements: ['@type = "REPORT"'],
        sort: '@duration desc',
        limit: 20,
      }),
    );

    define(
      'LambdaMemoryHeadroom',
      'lambda-memory-headroom',
      new logs.QueryString({
        filterStatements: ['@type = "REPORT"'],
        stats:
          'max(@memorySize / 1000 / 1000) as provisioned_mb, max(@maxMemoryUsed / 1000 / 1000) as max_used_mb, avg(@maxMemoryUsed / 1000 / 1000) as avg_used_mb',
      }),
    );

    define(
      'LambdaColdStarts',
      'lambda-cold-starts',
      new logs.QueryString({
        fields: ['@timestamp', '@requestId', '@initDuration'],
        filterStatements: ['@type = "REPORT"', 'ispresent(@initDuration)'],
        sort: '@timestamp desc',
        limit: 50,
      }),
    );

    define(
      'LogVolumeByStream',
      'log-volume-by-stream',
      new logs.QueryString({
        stats: 'count(*) as events by @logStream',
        sort: 'events desc',
        limit: 25,
      }),
    );
  }
}
