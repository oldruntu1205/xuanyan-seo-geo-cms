# SUNS 生产同步：开发机 → prod 43.132.209.126 / www.opctools.cloud
#
# 一键：生产构建 → 打包 → 上传 → 服务器部署（修 .next 路径、修 sharp 软链、重启 PM2）→ 验收
#
# 用法：
#   pwsh -File _deploy/sync-prod.ps1
#   pwsh -File _deploy/sync-prod.ps1 -SkipBuild     # 复用现有 .next 产物
#
# 前置：
#   - SSH 私钥就绪（Windows 必须先从 Downloads 复制到临时目录并收紧 ACL，否则报 UNPROTECTED PRIVATE KEY）。
#     默认路径 $env:TEMP\suns-deploy\id_rsa，可用 -KeyPath 覆盖。
#   - 服务器只跑不构建：本机负责 Next 产物，服务器只 pnpm install（装 Linux 平台二进制）。
[CmdletBinding()]
param(
  [string]$KeyPath = "$env:TEMP\suns-deploy\id_rsa",
  [string]$Host_ = '43.132.209.126',
  [switch]$SkipBuild,
  [switch]$SkipAcceptance
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$remote = "root@$Host_"
$sshOpts = @('-i', $KeyPath, '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=20')

if (-not (Test-Path $KeyPath)) {
  throw "找不到 SSH 私钥：$KeyPath。请先复制 BTC.pem 并执行 icacls 收紧权限，或用 -KeyPath 指定。"
}

Write-Host "`n=== [1/5] 生产构建 ===" -ForegroundColor Cyan
if ($SkipBuild) {
  Write-Host "  -SkipBuild：复用现有 apps/cms/.next"
  if (-not (Test-Path "$root\apps\cms\.next\BUILD_ID")) { throw "没有现成构建产物，去掉 -SkipBuild 重跑" }
} else {
  & pwsh -NoProfile -File "$PSScriptRoot\build-prod.ps1"
  if ($LASTEXITCODE -ne 0) { throw "生产构建失败" }
}

Write-Host "`n=== [2/5] 打包 ===" -ForegroundColor Cyan
python "$PSScriptRoot\pack-prod.py" | Tee-Object -Variable packOut
if ($LASTEXITCODE -ne 0) { throw "打包失败（含自检不通过）" }
$archive = Get-ChildItem "$PSScriptRoot\dist\suns-prod-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "  归档：$($archive.FullName)（$([math]::Round($archive.Length/1MB,1)) MB）"

Write-Host "`n=== [3/5] 上传 ===" -ForegroundColor Cyan
$remoteArchive = "/tmp/$($archive.Name)"
& scp @sshOpts $archive.FullName "${remote}:$remoteArchive"
& scp @sshOpts "$root\infrastructure\scripts\prod-deploy.sh" "${remote}:/tmp/prod-deploy.sh"
if ($LASTEXITCODE -ne 0) { throw "上传失败" }

Write-Host "`n=== [4/5] 服务器部署 ===" -ForegroundColor Cyan
& ssh @sshOpts $remote "chmod +x /tmp/prod-deploy.sh && /tmp/prod-deploy.sh $remoteArchive"

if ($SkipAcceptance) { Write-Host "`n[跳过验收]"; exit 0 }

Write-Host "`n=== [5/5] 公网验收 ===" -ForegroundColor Cyan
$targets = @(
  'https://www.opctools.cloud/',
  'https://www.opctools.cloud/en',
  'https://www.opctools.cloud/zh',
  'https://www.opctools.cloud/admin',
  'https://www.opctools.cloud/manage',
  'https://www.opctools.cloud/api/v1/health',
  'https://www.opctools.cloud/robots.txt',
  'https://opctools.cloud/en'
)
$failed = @()
foreach ($t in $targets) {
  $code = curl.exe -s -m 25 -o NUL -w '%{http_code}' -L $t
  $ok = $code -in @('200', '301', '302')
  if (-not $ok) { $failed += "$t -> $code" }
  $color = if ($ok) { 'Green' } else { 'Red' }
  Write-Host ("  {0,-50} -> {1}" -f $t, $code) -ForegroundColor $color
}

if ($failed.Count -gt 0) {
  Write-Host "`n验收失败项：" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  Write-Host "回滚：ssh 到服务器执行 /www/wwwroot/opctools/_backup_<时间戳>/ 下的 .next 覆盖回 apps/cms/.next 后 pm2 restart suns-cms" -ForegroundColor Yellow
  exit 1
}
Write-Host "`n全部验收通过。" -ForegroundColor Green
