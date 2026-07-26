param(
    [ValidateSet("customer", "workshop", "admin", "all")]
    [string]$App = "all",
    [switch]$Production
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$orgId = "team_hOrxF2gJh1reNpbmBHIeWuRV"
$projects = [ordered]@{
    customer = "prj_flAxNiTE1WHKOdUSHkHp1DzouqGx"
    workshop = "prj_TlVRsN2ghlGcLQbptHbK19JE1whe"
    admin = "prj_ZG17VH4H8ISHROFf9trgwlmgLT2i"
}

$targets = if ($App -eq "all") { @($projects.Keys) } else { @($App) }
$originalProjectId = $env:VERCEL_PROJECT_ID
$originalOrgId = $env:VERCEL_ORG_ID

try {
    Set-Location -LiteralPath $repoRoot
    foreach ($target in $targets) {
        $env:VERCEL_PROJECT_ID = $projects[$target]
        $env:VERCEL_ORG_ID = $orgId
        $arguments = @("vercel", "--yes")
        if ($Production) { $arguments += "--prod" }

        Write-Host "Deploying $target from repository root..."
        & npx @arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Vercel deployment failed for $target (exit $LASTEXITCODE)"
        }
    }
}
finally {
    $env:VERCEL_PROJECT_ID = $originalProjectId
    $env:VERCEL_ORG_ID = $originalOrgId
}
