# aws-observability-template（日本語版）

[![CI](https://github.com/ytokai/aws-observability-template/actions/workflows/ci.yml/badge.svg)](https://github.com/ytokai/aws-observability-template/actions/workflows/ci.yml)

AWS CDK（TypeScript）用のサービス別 CloudWatch ダッシュボードコンストラクトと、
Logs Insights の定番クエリ集。

English version: [README.md](README.md)
同じサービス群のアラームは [aws-alarm-template](https://github.com/ytokai/aws-alarm-template) を参照。

## 提供するもの

サービスごとに1コンストラクト。障害対応で実際に見る信号——**トラフィック・
エラー・レイテンシ・飽和度**——をカバーするダッシュボードを作成します。

| コンストラクト | ウィジェット |
|---|---|
| `LambdaDashboard` | 実行数とエラー、エラー率（メトリクス演算）、Duration avg/p90/p99、スロットル、同時実行数 |
| `ApiGatewayDashboard` | リクエスト数、4XX/5XX率、レイテンシ p50/p90/p99、統合レイテンシとの比較 |
| `EcsServiceDashboard` | CPU/メモリの平均・最大、実行タスク数（Container Insights・オプトイン） |
| `AuroraDashboard` | CPU、接続数、FreeableMemory、Read/Writeレイテンシ p90、ボリューム使用量 |
| `AlbDashboard` | リクエスト数、レスポンスコード（2XX〜5XX + ELB 5XX）、レイテンシ、コネクション、ターゲットヘルス |
| `CloudFrontDashboard` | リクエスト数、エラー率、転送量 — CloudFrontはグローバルサービスのため全ウィジェットを `us-east-1` に固定 |
| `LogsInsightsQueries` | 保存クエリ6本: 直近のエラー、頻出エラーメッセージ、Lambda最遅実行/メモリ余裕度/コールドスタート、ストリーム別ログ量 |

## 使い方

### ライブラリとしてインストール

```bash
npm install github:ytokai/aws-observability-template#v0.1.0
```

`aws-cdk-lib` と `constructs` は peerDependencies です（CDKアプリなら導入済みのはず）。

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

### サンプルスタックを試す

```bash
npm ci
npm test
npx cdk synth --quiet

# CloudWatch無料枠はダッシュボード3個まで。サブセットでデプロイ:
npx cdk deploy -c services=lambda,alb,ecs
npx cdk destroy
```

存在しないリソースを参照するダッシュボードも問題なくデプロイでき、
グラフが空になるだけなので、サンプルのダミーIDのまま安全に試せます。

> コスト補足: CloudWatch無料枠はダッシュボード3個（メトリクス50個まで）。
> 超過分は1個あたり約$3/月。Logs Insightsの保存クエリ自体は無料
> （実行時にスキャン量に応じた課金）。

## ダッシュボードJSONだけ欲しい場合

Terraformやコンソール、素のCloudFormationで使いたい場合は、synth結果から
`DashboardBody` を取り出せます：

```bash
npx cdk synth ObservabilityTemplateExample > template.yaml
# DashboardBody がCloudWatchコンソールにそのまま貼れるJSONです
```

## 設計メモ

- **方法論**: ウィジェットは「4つのゴールデンシグナル」（トラフィック・エラー・
  レイテンシ・飽和度）に沿って構成。ログを掘る前に「壊れているか・誰に影響か・
  なぜか」に答えられるダッシュボードを目指しています
- **件数よりエラー率**: サービスが件数しか公開しない場合（Lambda）は
  メトリクス演算でエラー率を算出
- **CloudFrontのリージョン固定**: CloudFrontのメトリクスはバージニア北部
  （us-east-1）にのみ発行されるため、ウィジェット単位で `us-east-1` を指定。
  どのリージョンのスタックからでも正しく表示されます

## ライセンス

MIT
