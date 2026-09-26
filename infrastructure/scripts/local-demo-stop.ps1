param([switch]$Force,[switch]$IncludeServices)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$runtime=Join-Path $root '.runtime'
$pidFile=Join-Path $runtime 'demo-pids.json'
$stopped=0
if(Test-Path $pidFile){
  $tracked=Get-Content $pidFile -Raw|ConvertFrom-Json
  foreach($p in $tracked.PSObject.Properties){& taskkill.exe /PID ([int]$p.Value) /T /F 2>&1|Out-Null;$stopped++;Write-Host "已停止 $($p.Name) (pid $($p.Value))"}
  Remove-Item $pidFile -Force
}
if($Force){
  $leftovers=@(Get-CimInstance Win32_Process -Filter "Name='node.exe'"|Where-Object{$_.CommandLine -match 'suns-New-code' -or $_.CommandLine -match '--parallel --filter @suns'})
  foreach($t in $leftovers){& taskkill.exe /PID $t.ProcessId /T /F 2>&1|Out-Null}
  Write-Host "已强制清理 $($leftovers.Count) 个本项目 Node 进程"
}
if($IncludeServices){
  $envText=Get-Content (Join-Path $root '.env') -Raw
  function ReadEnv([string]$key){if($envText -match "(?m)^$key=(.*)$"){$Matches[1].Trim()}else{''}}
  $redisPort=([uri](ReadEnv 'REDIS_URL')).Port
  & (Join-Path $runtime 'redis/redis-cli.exe') -p $redisPort shutdown nosave 2>&1|Out-Null
  Write-Host "Redis 已停止 (127.0.0.1:$redisPort)"
  & (Join-Path $runtime 'node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe') stop -D (Join-Path $runtime 'pg-data') -m fast -w 2>&1|Out-Null
  Write-Host 'PostgreSQL 已停止（数据保留在 .runtime/pg-data）'
}
Write-Host "演示应用已停止（脚本管理内 $stopped 个）"
