import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LambdaDashboard } from '../lib/lambda-dashboard';
import { EcsServiceDashboard } from '../lib/ecs-dashboard';
import { sanitizeDashboardName } from '../lib/common';

function templateWith(build: (stack: cdk.Stack) => void): Template {
  const stack = new cdk.Stack(new cdk.App(), 'Test');
  build(stack);
  return Template.fromStack(stack);
}

describe('sanitizeDashboardName', () => {
  test('replaces characters CloudWatch rejects', () => {
    expect(sanitizeDashboardName('app/my-alb/50dc6c495c0c9188')).toBe(
      'app-my-alb-50dc6c495c0c9188',
    );
  });
});

describe('LambdaDashboard', () => {
  test('includes error-rate math expression and latency percentiles', () => {
    const template = templateWith((stack) => {
      new LambdaDashboard(stack, 'Dash', { functionName: 'my-fn' });
    });
    const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
    const body = JSON.stringify(Object.values(dashboards)[0].Properties);
    expect(body).toContain('100 * errors / MAX([errors, invocations])');
    expect(body).toContain('p90');
    expect(body).toContain('p99');
  });
});

describe('EcsServiceDashboard', () => {
  test('omits Container Insights widget by default', () => {
    const template = templateWith((stack) => {
      new EcsServiceDashboard(stack, 'Dash', {
        clusterName: 'c1',
        serviceName: 's1',
      });
    });
    const body = JSON.stringify(
      Object.values(
        template.findResources('AWS::CloudWatch::Dashboard'),
      )[0].Properties,
    );
    expect(body).not.toContain('RunningTaskCount');
  });

  test('adds RunningTaskCount when containerInsights is true', () => {
    const template = templateWith((stack) => {
      new EcsServiceDashboard(stack, 'Dash', {
        clusterName: 'c1',
        serviceName: 's1',
        containerInsights: true,
      });
    });
    const body = JSON.stringify(
      Object.values(
        template.findResources('AWS::CloudWatch::Dashboard'),
      )[0].Properties,
    );
    expect(body).toContain('RunningTaskCount');
    expect(body).toContain('ECS/ContainerInsights');
  });
});
