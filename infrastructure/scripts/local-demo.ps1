param([int]$TimeoutSeconds=240,[int]$WorkerWaitSeconds=30)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$runtime=Join-Path $root '.runtime';$logs=Join-Path $runtime 'logs';New-Item -ItemType Directory -Force -Path $logs|Out-Null
$envFile=Join-Path $root '.env';if(-not (Test-Path $envFile)){throw '缺少 .env：先运行 pnpm run setup'}
$envText=Get-Content $envFile -Raw
function ReadEnv([string]$key){if($envText -match "(?m)^$key=(.*)$"){$Matches[1].Trim()}else{''}}
function Test-Port([int]$port){try{$c=[Net.Sockets.TcpClient]::new();$c.Connect('127.0.0.1',$port);$c.Close();$true}catch{$false}}
function Test-App([string]$name){@(Get-CimInstance Win32_Process -Filter "Name='node.exe'"|Where-Object{$_.CommandLine -match [regex]::Escape("suns-New-code\apps\$name")}).Count -gt 0}
# 本机无 Docker Engine：数据库取 .runtime 内的临时 PostgreSQL 连接串。应用用 dotenv 读根 .env，
# 但 dotenv 不覆盖已存在的环境变量，所以这里注入的 DATABASE_URL / REDIS_URL 优先（docs/DEPLOYMENT.md 口径）。
$connFile=Join-Path $runtime 'connection.json'
if(Test-Path $connFile){$dbUrl=(Get-Content $connFile -Raw|ConvertFrom-Json).DATABASE_URL;$dbSource='.runtime/connection.json'}else{$dbUrl=ReadEnv 'DATABASE_URL';$dbSource='.env'}
if(-not $dbUrl){throw '缺少 DATABASE_URL：先运行 node infrastructure/scripts/local-db.mjs 生成本机临时数据库'}
$redisUrl=ReadEnv 'REDIS_URL';if(-not $redisUrl){throw '.env 缺少 REDIS_URL'}
$locale=ReadEnv 'DEFAULT_LOCALE';if(-not $locale){$locale='en'}
$pgPort=([uri]$dbUrl).Port;$redisPort=([uri]$redisUrl).Port
$env:DATABASE_URL=$dbUrl;$env:REDIS_URL=$redisUrl
$envDb=(ReadEnv 'DATABASE_URL');if($envDb -and $envDb -ne $dbUrl){Write-Host "提示：.env 的 DATABASE_URL 指向 $(([uri]$envDb).Port) 端口（Docker 路径），本地演示用 $dbSource 的 $pgPort 端口"}
$pgCtl=Join-Path $runtime 'node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe';$pgData=Join-Path $runtime 'pg-data'
if(-not (Test-Path $pgCtl)){throw '本机缺少 embedded-postgres：npm install --prefix .runtime embedded-postgres@16.14.0-beta.17 后运行 node infrastructure/scripts/local-db.mjs'}
if(-not (Test-Path (Join-Path $pgData 'PG_VERSION'))){throw '数据库未初始化：先运行 node infrastructure/scripts/local-db.mjs'}
if(Test-Port $pgPort){Write-Host "PostgreSQL 已在 127.0.0.1:$pgPort 运行"}else{& $pgCtl start -D $pgData -l (Join-Path $logs 'postgres.log') -o "-p $pgPort -h 127.0.0.1" -w|Out-Null;Start-Sleep -Seconds 2;if(-not (Test-Port $pgPort)){throw 'PostgreSQL 启动失败，见 .runtime/logs/postgres.log'};Write-Host "PostgreSQL 已启动 127.0.0.1:$pgPort"}
$redisExe=Join-Path $runtime 'redis/redis-server.exe'
if(-not (Test-Path $redisExe)){throw '本机缺少 Windows Redis 运行包：解压到 .runtime/redis 后重试'}
if(Test-Port $redisPort){Write-Host "Redis 已在 127.0.0.1:$redisPort 运行"}else{$redisData=Join-Path $runtime 'redis-data';New-Item -ItemType Directory -Force -Path $redisData|Out-Null;Start-Process -FilePath $redisExe -ArgumentList '--bind','127.0.0.1','--port',"$redisPort",'--appendonly','no','--dir',$redisData -WorkingDirectory $redisData -WindowStyle Hidden|Out-Null;Start-Sleep -Seconds 2;if(-not (Test-Port $redisPort)){throw "Redis 启动失败，检查 $redisPort 端口占用"};Write-Host "Redis 已启动 127.0.0.1:$redisPort"}
Push-Location $root
try{
  & node (Join-Path $PSScriptRoot 'migrate.mjs') up|Out-Null
  if($LASTEXITCODE -ne 0){throw '业务迁移失败（database/*.sql）'}
  Write-Host '业务迁移（database/*.sql）已是最新'
  # Payload 账号迁移：只在确有 pending 时执行。数据库带 dev 模式标记（batch=-1）时 payload migrate 会弹出
  # “data loss will occur” 交互确认（@payloadcms/drizzle），无法非交互执行，也不应由脚本代替用户同意。
  $probe=@'
import pg from 'pg';
const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try{const r=await c.query('SELECT name,batch FROM payload_internal.payload_migrations');console.log(JSON.stringify(r.rows));}catch{console.log('[]');}
await c.end();
'@
  $applied=@();$devMarker=$false
  try{foreach($row in (($probe|node --input-type=module|Out-String).Trim()|ConvertFrom-Json)){if([int]$row.batch -eq -1){$devMarker=$true}else{$applied+=$row.name}}}catch{}
  $migFiles=@(Get-ChildItem (Join-Path $root 'apps/cms/src/migrations') -File -Filter '*.ts'|Where-Object{$_.Name -match '^\d{8}_'}|ForEach-Object{$_.BaseName})
  $pending=@($migFiles|Where-Object{$applied -notcontains $_})
  if(-not $pending.Count){Write-Host 'Payload 账号迁移已是最新（payload_internal.payload_migrations）'}
  elseif($devMarker){Write-Warning "有待执行的账号迁移：$($pending -join ', ')。该库带 dev 模式标记，payload migrate 会要求确认「data loss will occur」，请在有终端的窗口手动执行：pnpm auth:migrate"}
  else{& pnpm auth:migrate|Out-Null;if($LASTEXITCODE -ne 0){throw 'Payload 账号迁移失败'};Write-Host "已执行账号迁移：$($pending -join ', ')"}
}finally{Pop-Location}
$apps=@(@{name='cms';filter='@suns/cms';port=3001;health='http://127.0.0.1:3001/api/v1/health'},@{name='web';filter='@suns/web';port=3000;health="http://127.0.0.1:3000/$locale"},@{name='worker';filter='@suns/worker';port=0;health=''})
$pids=@{};foreach($app in $apps){if(Test-App $app.name){Write-Host "$($app.name) 已在运行（非本脚本启动；用 local-demo-stop.ps1 -Force 清理）";continue};$out=Join-Path $logs "$($app.name).out.log";$err=Join-Path $logs "$($app.name).err.log";$p=Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter',$app.filter,'dev' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err -PassThru;$pids[$app.name]=$p.Id;Write-Host "$($app.name) 已启动 pid=$($p.Id)（日志 .runtime/logs/$($app.name).out.log）"}
if($pids.Count){$pids|ConvertTo-Json|Set-Content (Join-Path $runtime 'demo-pids.json') -Encoding utf8}
$deadline=(Get-Date).AddSeconds($TimeoutSeconds)
foreach($app in $apps){if(-not $app.health){continue};$ok=$false;while((Get-Date) -lt $deadline){try{$r=Invoke-WebRequest -Uri $app.health -TimeoutSec 15 -SkipHttpErrorCheck;if($r.StatusCode -eq 200){$ok=$true;break}}catch{};Start-Sleep -Seconds 3};if($ok){Write-Host "$($app.name) 健康：$($app.health) -> 200"}else{Write-Warning "$($app.name) 在 $TimeoutSeconds 秒内未就绪，查看 .runtime/logs/$($app.name).err.log"}}
$redisCli=Join-Path $runtime 'redis/redis-cli.exe';$queueKeys=0
$workerDeadline=(Get-Date).AddSeconds($WorkerWaitSeconds)
while((Get-Date) -lt $workerDeadline){$queueKeys=@(& $redisCli -p $redisPort keys 'bull:static-publish:*' 2>&1).Count;if($queueKeys -gt 0){break};Start-Sleep -Seconds 2}
if($queueKeys -gt 0){Write-Host "队列已连通：bull:static-publish 键 $queueKeys 个（worker 已连上 Redis）"}else{Write-Warning "未检测到 bull:static-publish 键：worker 可能未连上 Redis，查看 .runtime/logs/worker.err.log"}
Write-Host ''
Write-Host "演示环境入口：前台 http://127.0.0.1:3000/$locale  后台 http://127.0.0.1:3001/admin  业务管理 http://127.0.0.1:3001/manage"
Write-Host "静态发布产物：$root\static-site（本机无 Nginx，前台由 web 应用读取已发布快照）"
