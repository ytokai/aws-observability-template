# aws-observability-template

[![CI](https://github.com/ytokai/aws-observability-template/actions/workflows/ci.yml/badge.svg)](https://github.com/ytokai/aws-observability-template/actions/workflows/ci.yml)

Service-specific CloudWatch dashboard constructs and a starter library of
Logs Insights queries for AWS CDK (TypeScript).

日本語版は [README.ja.md](README.ja.md) を参照してください。
Pairs well with [aws-alarm-template](https://github.com/ytokai/aws-alarm-template)
(alarms for the same services).

## What you get

One construct per service. Each creates a CloudWatch dashboard covering the
signals you actually look at during an incident: traffic, errors, latency,
and saturation.

| Construct | Widgets |
|---|---|
| `LambdaDashboard` | Invocations & errors, error rate (metric math), duration avg/p90/p99, throttles, concurrency |
| `ApiGatewayDashboard` | Request count, 4XX/5XX rates, latency p50/p90/p99, integration vs total latency |
| `EcsServiceDashboard` | CPU/memory avg & max, running task count (Container Insights, opt-in) |
| `AuroraDashboard` | CPU, connections, freeable memory, read/write latency p90, volume usage |
| `AlbDashboard` | Requests, response codes (2XX–5XX + ELB 5XX), latency percentiles, connections, target health |
| `CloudFrontDashboard` | Requests, error rates, data transfer — widgets pinned to `us-east-1` (CloudFront is a global service) |
| `LogsInsightsQueries` | 6 saved queries: recent errors, top error messages, Lambda slowest invocations / memory headroom / cold starts, log volume by stream |

## Usage

### Install as a library

```bash
npm install github:ytokai/aws-observability-template#v0.1.0
```

`aws-cdk-lib` and `constructs` are peer dependencies — your CDK app
already has them.

```ts
import { LambdaDashboard, AlbDashboard, LogsInsightsQueries } from 'aws-observability-template';

new LambdaDashboard(this, 'OrderProcessor', {
  functionName: 'order-processor',
});

new AlbDashboard(this, 'PublicAlb', {
  loadBalancerFullName: 'app/my-alb/50dc6c495c0c9188',
  targetGroupFullName: 'targetgroup/my-targets/cbf133c568e0d028',
});

new LogsInsightsQueries(this, 'SavedQueries');
```

### Try the example stack

```bash
npm ci
npm test
npx cdk synth --quiet

# CloudWatch's free tier includes 3 dashboards - deploy a subset:
npx cdk deploy -c services=lambda,alb,ecs
npx cdk destroy
```

Dashboards for non-existent resources deploy fine and render empty graphs,
so the placeholder identifiers in the example stack are safe to deploy.

> Cost note: the CloudWatch free tier includes 3 dashboards (up to 50 metrics).
> Additional dashboards are about $3/month each. Saved Logs Insights queries
> are free (you pay per query run, based on data scanned).

## Getting the raw dashboard JSON

Need the dashboard definition for Terraform, the console, or plain
CloudFormation? Synthesize and pull it from the template:

```bash
npx cdk synth ObservabilityTemplateExample > template.yaml
# DashboardBody in the output is the JSON the CloudWatch console accepts
```

## Design notes

- **Method**: widgets follow the "four golden signals" (traffic, errors,
  latency, saturation) so every dashboard answers *is it broken, for whom,
  and why* before you dig into logs.
- **Error rates over error counts** where the service exposes only counts
  (Lambda), computed with CloudWatch metric math.
- **CloudFront region pinning**: CloudFront publishes metrics to
  US East (N. Virginia) only; the construct pins `us-east-1` per widget so
  the dashboard works from any stack region.

## License

MIT
