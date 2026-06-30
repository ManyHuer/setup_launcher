import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

function getTempDir() {
  const dir = path.join(app.getPath('userData'), 'temp');
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}

const PS_STARTMENU = `
$folders = @(
  "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs",
  "$env:PROGRAMDATA\\Microsoft\\Windows\\Start Menu\\Programs"
)
$sh = New-Object -ComObject WScript.Shell
$results = @()
$skipExes = @('msiexec.exe', 'explorer.exe', 'rundll32.exe', 'uninstall.exe', 'unins000.exe', 'setup.exe', 'install.exe')
foreach ($folder in $folders) {
  if (-not (Test-Path $folder)) { continue }
  $lnks = Get-ChildItem -Path $folder -Recurse -Filter *.lnk -ErrorAction SilentlyContinue
  foreach ($lnk in $lnks) {
    try {
      $sc = $sh.CreateShortcut($lnk.FullName)
      $target = $sc.TargetPath
      $args = $sc.Arguments
      if (-not $target) { continue }
      $ext = [System.IO.Path]::GetExtension($target).ToLower()
      $base = [System.IO.Path]::GetFileNameWithoutExtension($target).ToLower()
      if ($skipExes -contains ($base + '.exe')) { continue }
      if ($ext -in '.exe', '.bat', '.cmd', '.ps1' -and (Test-Path $target)) {
        $results += [PSCustomObject]@{ name = $lnk.BaseName; executable_path = $target }
      }
    } catch {}
  }
}
$sh = $null
[System.GC]::Collect()
return $results | ConvertTo-Json -Compress
`;

const PS_REGISTRY = `
$paths = @(
  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
)
$results = @()
$skipExes = @('msiexec.exe', 'explorer.exe', 'rundll32.exe', 'uninstall.exe', 'unins000.exe', 'setup.exe', 'install.exe')
foreach ($regPath in $paths) {
  $items = Get-ItemProperty -Path $regPath -ErrorAction SilentlyContinue
  foreach ($item in $items) {
    $name = $item.DisplayName
    if (-not $name) { continue }
    $exe = $null
    if ($item.DisplayIcon) {
      $icon = $item.DisplayIcon -replace ',.*$', ''
      try {
        $ext = [System.IO.Path]::GetExtension($icon).ToLower()
        if ($ext -in '.exe', '.bat', '.cmd', '.ps1' -and (Test-Path $icon)) {
          $exe = $icon
        }
      } catch {}
    }
    if (-not $exe -and $item.InstallLocation) {
      try {
        $candidates = Get-ChildItem -Path $item.InstallLocation -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in '.exe', '.bat', '.cmd', '.ps1' }
        if ($candidates) {
          $displayClean = ($name -replace '[^a-zA-Z0-9]', '').ToLower()
          $best = $candidates | Sort-Object { $_.BaseName.Length } -Descending | Where-Object { $displayClean -match [Regex]::Escape(($_.BaseName -replace '[^a-zA-Z0-9]', '').ToLower()) } | Select-Object -First 1
          if (-not $best) { $best = $candidates | Select-Object -First 1 }
          $exe = $best.FullName
        }
      } catch {}
    }
    if (-not $exe -and $item.UninstallString) {
      $un = $item.UninstallString -replace '^"|"$', '' -replace '/I.*$', '' -replace ' /.*$', ''
      try {
        if (Test-Path $un) { $exe = $un }
      } catch {}
    }
    if ($exe) {
      try {
        $base = [System.IO.Path]::GetFileNameWithoutExtension($exe).ToLower()
        if ($skipExes -contains ($base + '.exe')) { continue }
        if (Test-Path $exe) {
          $results += [PSCustomObject]@{ name = $name; executable_path = $exe }
        }
      } catch {}
    }
  }
}
return $results | ConvertTo-Json -Compress
`;

const PS_UWP = `
$apps = Get-StartApps -ErrorAction SilentlyContinue
$results = @()
foreach ($app in $apps) {
  $results += [PSCustomObject]@{ name = $app.Name; app_id = $app.AppId }
}
return $results | ConvertTo-Json -Compress
`;

function runPSScript(script, id) {
  return new Promise((resolve) => {
    const scriptPath = path.join(getTempDir(), `_scan_${id}.ps1`);
    try {
      fs.writeFileSync(scriptPath, script, 'utf-8');
    } catch {
      resolve([]);
      return;
    }
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { encoding: 'utf-8', timeout: 15000, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => {
        try { fs.unlinkSync(scriptPath); } catch {}
        if (err) { resolve([]); return; }
        try {
          const parsed = JSON.parse(stdout.trim());
          if (!Array.isArray(parsed)) { resolve([]); return; }
          resolve(parsed.filter((a) => a && a.name));
        } catch {
          resolve([]);
        }
      }
    );
  });
}

function dedupeAndSort(apps) {
  const seen = new Set();
  const unique = [];
  for (const app of apps) {
    if (!app.name) continue;
    const path = app.executable_path || app.app_id;
    if (!path) continue;
    const key = path.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(app);
    }
  }
  unique.sort((a, b) => a.name.localeCompare(b.name));
  return unique;
}

export async function scanStartMenu() {
  const apps = await runPSScript(PS_STARTMENU, 'startmenu');
  return dedupeAndSort(apps.map((a) => ({ ...a, source: 'start-menu' })));
}

export async function scanRegistry() {
  const apps = await runPSScript(PS_REGISTRY, 'registry');
  return dedupeAndSort(apps.map((a) => ({ ...a, source: 'registry' })));
}

export async function scanUWP() {
  const apps = await runPSScript(PS_UWP, 'uwp');
  const uwp = apps.filter((a) => a.app_id && a.app_id.includes('!'));
  return dedupeAndSort(uwp.map((a) => ({ name: a.name, executable_path: 'uwp://' + a.app_id, source: 'uwp' })));
}

export async function scanAll() {
  const [startMenu, registry, uwp] = await Promise.all([
    scanStartMenu(),
    scanRegistry(),
    scanUWP(),
  ]);
  return dedupeAndSort([...startMenu, ...registry, ...uwp]);
}
