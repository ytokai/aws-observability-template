import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ExampleStack } from '../lib/example-stack';

describe('ExampleStack (all services)', () => {
  const app = new cdk.App();
  const stack = new ExampleStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  test('matches snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });

  test('creates one dashboard per service', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 6);
  });

  test('creates the saved Logs Insights queries', () => {
    template.resourceCountIs('AWS::Logs::QueryDefinition', 6);
  });

  test('CloudFront widgets pin the us-east-1 region', () => {
    const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
    const cloudfront = Object.entries(dashboards).find(([logicalId]) =>
      logicalId.startsWith('Cdn'),
    );
    expect(cloudfront).toBeDefined();
    const body = JSON.stringify(cloudfront![1].Properties.DashboardBody);
    expect(body).toContain('us-east-1');
  });
});

describe('ExampleStack (subset via services prop)', () => {
  test('only creates the selected dashboards', () => {
    const app = new cdk.App();
    const stack = new ExampleStack(app, 'SubsetStack', {
      services: ['lambda', 'alb', 'ecs'],
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 3);
  });
});
