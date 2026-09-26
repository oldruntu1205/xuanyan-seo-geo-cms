$ErrorActionPreference='Stop'
node (Join-Path $PSScriptRoot 'verify.mjs') @args
if($LASTEXITCODE -ne 0){throw 'Database verification failed'}
