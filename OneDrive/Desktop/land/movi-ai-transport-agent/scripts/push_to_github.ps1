<#
push_to_github.ps1

Usage examples:
  # Interactive using gh CLI (recommended)
  .\scripts\push_to_github.ps1 -UseGH

  # Provide a remote URL (HTTPS or SSH)
  .\scripts\push_to_github.ps1 -RemoteUrl "https://github.com/Ruparani777/movi-ai-transport-agent.git"

  # Provide custom owner/name/email
  .\scripts\push_to_github.ps1 -Owner "Ruparani777" -RepoName "movi-ai-transport-agent" -UserName "Ruparani777" -Email "roopathupakula01@gmail.com" -UseGH

Notes:
- This script runs locally and will prompt for authentication when required (gh auth or git credentials).
- It will not expose any credentials. You must authenticate where prompted (gh or GitHub PAT in your credential helper).
- The script is idempotent and safe to re-run.
#>

param(
    [string]$Owner = "Ruparani777",
    [string]$RepoName = "movi-ai-transport-agent",
    [string]$UserName = "Ruparani777",
    [string]$Email = "roopathupakula01@gmail.com",
    [switch]$UseGH,
    [string]$RemoteUrl
)

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg){ Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

Push-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)
# Move to repo root (assume script is in scripts/ under project root)
Set-Location ..\
$RepoRoot = Get-Location
Write-Info "Repository root: $RepoRoot"

# Check git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "git is not installed or not on PATH. Install git first: https://git-scm.com/downloads"
    exit 1
}

# Initialize git repository if not present
$inside = & git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Info "No git repository detected; initializing..."
    git init
    Write-Ok "Initialized empty git repository"
} else {
    Write-Info "Git repository detected"
}

# Ensure .gitignore contains common entries
$gitignore = ".gitignore"
$required = @(
    "# Python venv",
    ".venv/",
    "backend/.venv/",
    "venv/",
    "# Node modules",
    "node_modules/",
    "# DB files",
    "db/",
    "db/*.db",
    "# OS files",
    ".DS_Store",
    "Thumbs.db",
    "# IDE",
    ".vscode/"
)

if (-not (Test-Path $gitignore)) {
    Write-Info "Creating .gitignore"
    $required | Out-File -FilePath $gitignore -Encoding utf8
    Write-Ok ".gitignore created"
} else {
    $content = Get-Content $gitignore -ErrorAction SilentlyContinue
    $added = $false
    foreach ($line in $required) {
        if (-not ($content -contains $line)) {
            Add-Content -Path $gitignore -Value $line
            $added = $true
        }
    }
    if ($added) { Write-Ok "Updated .gitignore with common entries" } else { Write-Info ".gitignore already contains required entries" }
}

# Configure local git user
git config user.name "$UserName"
git config user.email "$Email"
Write-Info "Set local git user.name and user.email"

# Stage and commit
# Check for changes
$hasChanges = (& git status --porcelain).Trim() -ne ""
if ($hasChanges) {
    Write-Info "Staging all changes..."
    git add .
    $commitMessage = "Initial commit: Movi AI transport agent - $(Get-Date -Format o)"
    git commit -m $commitMessage
    Write-Ok "Committed changes"
} else {
    Write-Info "No changes to commit"
}

# Function to push via gh
function Push-With-GH {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Warn "gh CLI not found. Install it from https://cli.github.com/ and authenticate with 'gh auth login'"
        return $false
    }

    Write-Info "Checking gh authentication status..."
    $auth = & gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Not authenticated with gh. Running 'gh auth login' interactively..."
        gh auth login
    }

    Write-Info "Creating repo on GitHub and pushing (may ask for interactive confirmations)..."
    # gh repo create will create and push the current folder
    gh repo create $Owner/$RepoName --public --source=. --remote=origin --push --confirm
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Repository created and pushed via gh"
        return $true
    } else {
        Write-Err "gh repo create failed"
        return $false
    }
}

# Function to push using provided RemoteUrl
function Push-With-RemoteUrl($url) {
    # set remote (overwrite if exists)
    if ((git remote) -contains "origin") {
        Write-Info "Remote 'origin' already exists. Updating URL to $url"
        git remote set-url origin $url
    } else {
        git remote add origin $url
    }
    Write-Info "Pushing to origin/master..."
    git push -u origin master
    if ($LASTEXITCODE -eq 0) { Write-Ok "Pushed to $url"; return $true } else { Write-Err "Push failed"; return $false }
}

$result = $false

if ($UseGH) {
    $result = Push-With-GH
} elseif ($RemoteUrl) {
    $result = Push-With-RemoteUrl $RemoteUrl
} else {
    # If gh exists, use it by default
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Info "gh CLI available; using gh to create and push the repo"
        $result = Push-With-GH
    } else {
        Write-Warn "No RemoteUrl provided and gh CLI not found. Please create the GitHub repo and run the script again with -RemoteUrl or install gh."
        Write-Host "Manual steps to push:"
        Write-Host " 1) Create repo on GitHub at https://github.com/$Owner/$RepoName (do not initialize with README)"
        Write-Host " 2) Then run: git remote add origin https://github.com/$Owner/$RepoName.git; git push -u origin master"
    }
}

if ($result) {
    Write-Ok "Push completed. Open https://github.com/$Owner/$RepoName to verify."
} else {
    Write-Warn "Push did not complete successfully. See messages above and try again."
}

Pop-Location
