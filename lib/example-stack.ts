import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaDashboard } from './lambda-dashboard';
import { ApiGatewayDashboard } from './api-gateway-dashboard';
import { EcsServiceDashboard } from './ecs-dashboard';
import { AuroraDashboard } from './aurora-dashboard';
import { AlbDashboard } from './alb-dashboard';
import { CloudFrontDashboard } from './cloudfront-dashboard';
import { LogsInsightsQueries } from './logs-insights-queries';

export type ExampleService =
  | 'lambda'
  | 'apigateway'
  | 'ecs'
  | 'aurora'
  | 'alb'
  | 'cloudfront';

export interface ExampleStackProps extends cdk.StackProps {
  /**
   * Which service dashboards to create.
   * The CloudWatch free tier includes 3 dashboards, so deploy a
   * subset when trying this out (e.g. `-c services=lambda,alb,ecs`).
   * @default - all services
   */
  readonly services?: ExampleService[];
}

/**
 * Example stack wiring every dashboard construct to placeholder
 * resource identifiers. Replace them with your own resources.
 * Dashboards for non-existent resources deploy fine and simply
 * render empty graphs.
 */
export class ExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ExampleStackProps = {}) {
    super(scope, id, props);

    const services =
      props.services ??
      (['lambda', 'apigateway', 'ecs', 'aurora', 'alb', 'cloudfront'] as const);

    if (services.includes('lambda')) {
      new LambdaDashboard(this, 'OrderProcessor', {
        functionName: 'order-processor',
      });
    }

    if (services.includes('apigateway')) {
      new ApiGatewayDashboard(this, 'PublicApi', {
        apiName: 'public-api',
        stage: 'prod',
      });
    }

    if (services.includes('ecs')) {
      new EcsServiceDashboard(this, 'ApiService', {
        clusterName: 'app-cluster',
        serviceName: 'api-service',
        containerInsights: true,
      });
    }

    if (services.includes('aurora')) {
      new AuroraDashboard(this, 'AppDatabase', {
        dbClusterIdentifier: 'app-database',
      });
    }

    if (services.includes('alb')) {
      new AlbDashboard(this, 'PublicAlb', {
        loadBalancerFullName: 'app/my-alb/50dc6c495c0c9188',
        targetGroupFullName: 'targetgroup/my-targets/cbf133c568e0d028',
      });
    }

    if (services.includes('cloudfront')) {
      new CloudFrontDashboard(this, 'Cdn', {
        distributionId: 'E1ABCDEF2GHIJK',
      });
    }

    new LogsInsightsQueries(this, 'SavedQueries');
  }
}
