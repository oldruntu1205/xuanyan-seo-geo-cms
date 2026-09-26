param([ValidateSet('up','down','status')][string]$Direction='up',[string]$Target='')
$ErrorActionPreference='Stop'
$scriptPath=Join-Path $PSScriptRoot 'migrate.mjs'
if($Target){node $scriptPath $Direction $Target}else{node $scriptPath $Direction}
if($LASTEXITCODE -ne 0){throw 'Database migration failed'}
