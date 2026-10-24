# SUNS 生产构建（在开发机执行，产物上传到 prod）
#
# 为什么需要这个脚本：Next.js 会把 NEXT_PUBLIC_* 在构建期内联进客户端 bundle，
# 用开发环境的 .env 直接 build 会把 http://localhost:3000 固化进 CMS 前端资源。
# 同时 DEPLOYMENT_ENV / TRUST_PROXY 影响发布产物的 robots 与限流行为。
#
# 用法：pwsh -File _deploy/build-prod.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$env:NEXT_PUBLIC_SITE_URL = 'https://www.opctools.cloud'
$env:DEPLOYMENT_ENV       = 'production'
$env:TRUST_PROXY          = '1'
$env:CORS_ORIGINS         = 'https://www.opctools.cloud,https://opctools.cloud'
# 构建期占位密钥：运行期由服务器 .env 提供真实值
$env:PAYLOAD_SECRET       = 'build-only-secret-not-used-at-runtime-000000000000'

# 构建期若触发数据库访问，指向本机临时实例；生产连接串只存在于服务器 .env
$connFile = Join-Path $root '.runtime/connection.json'
if (Test-Path $connFile) {
  $env:DATABASE_URL = (Get-Content $connFile -Raw | ConvertFrom-Json).DATABASE_URL
  Write-Host "[build] DATABASE_URL 使用本机临时实例（构建期占位）"
} else {
  Write-Warning "[build] 未找到 .runtime/connection.json，构建期 DB 访问可能失败"
}

Write-Host "[build] NEXT_PUBLIC_SITE_URL=$env:NEXT_PUBLIC_SITE_URL  DEPLOYMENT_ENV=$env:DEPLOYMENT_ENV"

pnpm --filter @suns/cms exec payload generate:importmap
if ($LASTEXITCODE -ne 0) { throw "生产构建失败：payload generate:importmap 退出码 $LASTEXITCODE" }
pnpm --filter @suns/cms build
# 必须显式检查：PowerShell 对原生命令非零退出不抛异常，否则后续本地私有部署脚本会拿失败/陈旧的 .next 继续部署
if ($LASTEXITCODE -ne 0) { throw "生产构建失败：next build 退出码 $LASTEXITCODE（.next 未更新，勿部署）" }

Write-Host "[build] 完成：apps/cms/.next 已生成（生产变量）"
