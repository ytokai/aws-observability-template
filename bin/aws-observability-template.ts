#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ExampleStack, ExampleService } from '../lib/example-stack';

const app = new cdk.App();

// Limit dashboards to stay in the CloudWatch free tier (3 dashboards):
//   npx cdk deploy -c services=lambda,alb,ecs
const servicesContext: string | undefined = app.node.tryGetContext('services');

new ExampleStack(app, 'ObservabilityTemplateExample', {
  services: servicesContext
    ? (servicesContext.split(',') as ExampleService[])
    : undefined,
});
