#!/usr/bin/env node
/**
 * Pre-Optimization 3D Code & Asset Baseline Auditor
 * Scans src/ and public/ to record honest baseline metrics for:
 * - Every <Canvas> mount, frameloop mode, dpr, gl flags (preserveDrawingBuffer, antialias, powerPreference)
 * - Every eager module-scope useGLTF.preload(...) call
 * - Light counts per 3D scene file
 * - SafeContactShadows / ContactShadows resolutions, frames, blur
 * - Environment HDR paths (forest_env.hdr vs forest_env.optimized.hdr vs presets)
 * - next/dynamic boundaries (ssr: false)
 * - Exact byte/KB/MB sizes of all .glb, .hdr, .usdz, and /draco/* assets
 * - Stale .bak files in src/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DEFAULT_OUT_PATH =
  'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2\\baseline_3d_metrics.json';

function parseArgs() {
  const args = process.argv.slice(2);
  let outPath = DEFAULT_OUT_PATH;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outPath = path.resolve(args[i + 1]);
      i++;
    }
  }
  return { outPath };
}

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function toRel(fullPath) {
  return path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
}

function lineNumberAt(content, index) {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
}

function extractJSXOpeningTag(content, startIndex) {
  // Walk forward from `<TagName` until matching `>` taking `{...}` braces into account
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  for (let i = startIndex; i < content.length; i++) {
    const ch = content[i];
    const prev = i > 0 ? content[i - 1] : '';
    if (prev !== '\\') {
      if (!inDouble && !inTemplate && ch === "'") inSingle = !inSingle;
      else if (!inSingle && !inTemplate && ch === '"') inDouble = !inDouble;
      else if (!inSingle && !inDouble && ch === '`') inTemplate = !inTemplate;
    }
    if (inSingle || inDouble || inTemplate) continue;
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    else if (ch === '>' && depth === 0) {
      return content.slice(startIndex, i + 1);
    }
  }
  return content.slice(startIndex, Math.min(content.length, startIndex + 600));
}

function formatKB(bytes) {
  return Number((bytes / 1024).toFixed(1));
}

function formatMB(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

function auditCodebase() {
  const srcDir = path.join(ROOT_DIR, 'src');
  const publicDir = path.join(ROOT_DIR, 'public');

  const allSrcFiles = walkDir(srcDir);
  const bakFiles = allSrcFiles
    .filter((f) => f.includes('.bak'))
    .map((f) => ({
      path: toRel(f),
      bytes: fs.statSync(f).size,
    }));

  const sourceFiles = allSrcFiles.filter(
    (f) => !f.includes('.bak') && /\.(tsx?|jsx?|mjs|cjs)$/.test(f)
  );

  const canvasMounts = [];
  const preloadCalls = [];
  const sceneLighting = [];
  const contactShadows = [];
  const preserveDrawingBufferUsages = [];
  const environmentUsages = [];
  const dynamicImports = [];

  const LIGHT_TAGS = [
    'ambientLight',
    'directionalLight',
    'pointLight',
    'spotLight',
    'hemisphereLight',
    'rectAreaLight',
  ];

  for (const filePath of sourceFiles) {
    const relPath = toRel(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    // 1. <Canvas ...> mounts
    const canvasRegex = /<Canvas\b/g;
    let match;
    while ((match = canvasRegex.exec(content)) !== null) {
      const tag = extractJSXOpeningTag(content, match.index);
      const line = lineNumberAt(content, match.index);

      let frameloop = 'always (implicit default)';
      const flStringMatch = tag.match(/frameloop\s*=\s*["']([^"']+)["']/);
      const flExprMatch = tag.match(/frameloop\s*=\s*\{([^}]+)\}/);
      if (flStringMatch) frameloop = flStringMatch[1];
      else if (flExprMatch) frameloop = flExprMatch[1].trim();

      const dprMatch = tag.match(/dpr\s*=\s*(\{[^}]+\}|["'][^"']+["'])/);
      const shadowsMatch = tag.match(/shadows(?:\s*=\s*(\{[^}]+\}|["'][^"']+["']))?/);
      const preserveMatch = tag.match(/preserveDrawingBuffer\s*:\s*([^,\n}]+)/);
      const antialiasMatch = tag.match(/antialias\s*:\s*([^,\n}]+)/);
      const powerPrefMatch = tag.match(/powerPreference\s*:\s*([^,\n}]+)/);

      canvasMounts.push({
        file: relPath,
        line,
        frameloop,
        dpr: dprMatch ? dprMatch[1].trim() : 'default',
        shadows: shadowsMatch ? (shadowsMatch[1] ? shadowsMatch[1].trim() : 'true') : 'false',
        preserveDrawingBuffer: preserveMatch ? preserveMatch[1].trim() : 'false (default)',
        antialias: antialiasMatch ? antialiasMatch[1].trim() : 'default',
        powerPreference: powerPrefMatch ? powerPrefMatch[1].trim() : 'default',
      });
    }

    // 2. useGLTF.preload(...) calls
    const preloadRegex = /useGLTF\.preload\s*\(([^)]*)\)/g;
    while ((match = preloadRegex.exec(content)) !== null) {
      const line = lineNumberAt(content, match.index);
      const lineText = lines[line - 1] || '';
      const isCommented = /^\s*\/\//.test(lineText);
      if (!isCommented) {
        const beforeSlice = content.slice(0, match.index);
        // Approximate top-level check: brace depth at call site
        let braceDepth = 0;
        for (let i = 0; i < beforeSlice.length; i++) {
          if (beforeSlice[i] === '{') braceDepth++;
          else if (beforeSlice[i] === '}') braceDepth = Math.max(0, braceDepth - 1);
        }
        preloadCalls.push({
          file: relPath,
          line,
          args: match[1].replace(/\s+/g, ' ').trim(),
          statement: match[0].replace(/\s+/g, ' ').trim(),
          moduleScope: braceDepth === 0,
        });
      }
    }

    // 3. Lights per scene
    const lightCounts = {};
    let totalLightsInFile = 0;
    for (const lt of LIGHT_TAGS) {
      const ltRegex = new RegExp(`<${lt}\\b`, 'g');
      const matches = content.match(ltRegex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        lightCounts[lt] = count;
        totalLightsInFile += count;
      }
    }
    if (totalLightsInFile > 0) {
      sceneLighting.push({
        file: relPath,
        totalLights: totalLightsInFile,
        breakdown: lightCounts,
      });
    }

    // 4. SafeContactShadows & ContactShadows
    const shadowTagRegex = /<(SafeContactShadows|ContactShadows)\b/g;
    while ((match = shadowTagRegex.exec(content)) !== null) {
      const componentName = match[1];
      const tag = extractJSXOpeningTag(content, match.index);
      const line = lineNumberAt(content, match.index);
      const resMatch = tag.match(/resolution\s*=\s*\{([^}]+)\}|resolution\s*=\s*(\d+)/);
      const framesMatch = tag.match(/frames\s*=\s*\{([^}]+)\}|frames\s*=\s*(\d+)/);
      const blurMatch = tag.match(/blur\s*=\s*\{([^}]+)\}|blur\s*=\s*([\d.]+)/);
      const scaleMatch = tag.match(/scale\s*=\s*\{([^}]+)\}|scale\s*=\s*([\d.]+)/);
      contactShadows.push({
        file: relPath,
        line,
        component: componentName,
        resolution: resMatch ? (resMatch[1] || resMatch[2]).trim() : 'default (256/512)',
        frames: framesMatch ? (framesMatch[1] || framesMatch[2]).trim() : 'Infinity (default)',
        blur: blurMatch ? (blurMatch[1] || blurMatch[2]).trim() : 'default',
        scale: scaleMatch ? (scaleMatch[1] || scaleMatch[2]).trim() : 'default',
      });
    }

    // 5. preserveDrawingBuffer occurrences anywhere in file
    const pdbRegex = /preserveDrawingBuffer\s*:\s*([^,\n}\s]+)/g;
    while ((match = pdbRegex.exec(content)) !== null) {
      preserveDrawingBufferUsages.push({
        file: relPath,
        line: lineNumberAt(content, match.index),
        value: match[1].trim(),
      });
    }

    // 6. HDR & <Environment ...> usages
    const envTagRegex = /<Environment\b/g;
    while ((match = envTagRegex.exec(content)) !== null) {
      const tag = extractJSXOpeningTag(content, match.index);
      const line = lineNumberAt(content, match.index);
      const filesMatch = tag.match(/files\s*=\s*(?:["']([^"']+)["']|\{([^}]+)\})/);
      const presetMatch = tag.match(/preset\s*=\s*(?:["']([^"']+)["']|\{([^}]+)\})/);
      environmentUsages.push({
        file: relPath,
        line,
        files: filesMatch ? (filesMatch[1] || filesMatch[2]).trim() : null,
        preset: presetMatch ? (presetMatch[1] || presetMatch[2]).trim() : null,
        rawTag: tag.replace(/\s+/g, ' ').trim(),
      });
    }
    const hdrLiteralRegex = /['"`]([^'"`]*\.hdr)['"`]/g;
    while ((match = hdrLiteralRegex.exec(content)) !== null) {
      const line = lineNumberAt(content, match.index);
      const alreadyRecorded = environmentUsages.some(
        (e) => e.file === relPath && Math.abs(e.line - line) <= 2
      );
      if (!alreadyRecorded) {
        environmentUsages.push({
          file: relPath,
          line,
          files: match[1],
          preset: null,
          rawTag: 'string-literal',
        });
      }
    }

    // 7. next/dynamic boundaries (balanced parentheses extraction)
    const dynamicStartRegex = /\bdynamic\s*\(/g;
    while ((match = dynamicStartRegex.exec(content)) !== null) {
      const parenStart = content.indexOf('(', match.index);
      if (parenStart === -1) continue;
      let depth = 0;
      let endIdx = parenStart;
      for (let i = parenStart; i < content.length; i++) {
        if (content[i] === '(') depth++;
        else if (content[i] === ')') {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
      const block = content.slice(match.index, endIdx + 1);
      const importMatch = block.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (importMatch) {
        const line = lineNumberAt(content, match.index);
        const ssrFalse = /ssr\s*:\s*false/.test(block);
        dynamicImports.push({
          file: relPath,
          line,
          importedModule: importMatch[1],
          ssrFalse,
        });
      }
    }
  }

  // 8. Public 3D / HDR / Draco assets inventory
  const allPublicFiles = walkDir(publicDir);
  const glbAssets = [];
  const hdrAssets = [];
  const dracoAssets = [];
  const usdzAssets = [];

  for (const pubFile of allPublicFiles) {
    const rel = toRel(pubFile);
    const stat = fs.statSync(pubFile);
    const ext = path.extname(pubFile).toLowerCase();
    if (ext === '.glb' || ext === '.gltf') {
      glbAssets.push({
        path: rel,
        url: '/' + rel.replace(/^public\//, ''),
        bytes: stat.size,
        sizeKB: formatKB(stat.size),
        sizeMB: formatMB(stat.size),
      });
    } else if (ext === '.hdr' || ext === '.exr') {
      hdrAssets.push({
        path: rel,
        url: '/' + rel.replace(/^public\//, ''),
        bytes: stat.size,
        sizeKB: formatKB(stat.size),
        sizeMB: formatMB(stat.size),
      });
    } else if (ext === '.usdz') {
      usdzAssets.push({
        path: rel,
        url: '/' + rel.replace(/^public\//, ''),
        bytes: stat.size,
        sizeKB: formatKB(stat.size),
        sizeMB: formatMB(stat.size),
      });
    } else if (rel.startsWith('public/draco/')) {
      dracoAssets.push({
        path: rel,
        url: '/' + rel.replace(/^public\//, ''),
        bytes: stat.size,
        sizeKB: formatKB(stat.size),
      });
    }
  }

  glbAssets.sort((a, b) => b.bytes - a.bytes);
  hdrAssets.sort((a, b) => b.bytes - a.bytes);
  dracoAssets.sort((a, b) => b.bytes - a.bytes);

  const totalGlbBytes = glbAssets.reduce((sum, a) => sum + a.bytes, 0);
  const totalHdrBytes = hdrAssets.reduce((sum, a) => sum + a.bytes, 0);
  const totalDracoBytes = dracoAssets.reduce((sum, a) => sum + a.bytes, 0);

  const forestRaw = hdrAssets.find((h) => h.path.endsWith('forest_env.hdr'));
  const forestOpt = hdrAssets.find((h) => h.path.endsWith('forest_env.optimized.hdr'));

  return {
    capturedAt: new Date().toISOString(),
    projectRoot: ROOT_DIR,
    summary: {
      totalSourceFilesScanned: sourceFiles.length,
      totalCanvasMounts: canvasMounts.length,
      eagerUseGLTFPreloadCount: preloadCalls.length,
      moduleScopePreloadCount: preloadCalls.filter((p) => p.moduleScope).length,
      scenesWithLightsCount: sceneLighting.length,
      contactShadowCount: contactShadows.length,
      preserveDrawingBufferTrueCount: preserveDrawingBufferUsages.filter((p) => p.value === 'true').length,
      environmentUsageCount: environmentUsages.length,
      unoptimizedForestHdrRefs: environmentUsages.filter(
        (e) => e.files && e.files.includes('forest_env.hdr') && !e.files.includes('optimized')
      ).length,
      optimizedForestHdrRefs: environmentUsages.filter(
        (e) => e.files && e.files.includes('forest_env.optimized.hdr')
      ).length,
      dynamicSsrFalseCount: dynamicImports.filter((d) => d.ssrFalse).length,
      staleBakFileCount: bakFiles.length,
      assets: {
        glbFileCount: glbAssets.length,
        totalGlbBytes,
        totalGlbMB: formatMB(totalGlbBytes),
        hdrFileCount: hdrAssets.length,
        totalHdrBytes,
        totalHdrKB: formatKB(totalHdrBytes),
        forestEnvHdrComparison:
          forestRaw && forestOpt
            ? {
                rawPath: forestRaw.url,
                rawBytes: forestRaw.bytes,
                rawKB: forestRaw.sizeKB,
                optimizedPath: forestOpt.url,
                optimizedBytes: forestOpt.bytes,
                optimizedKB: forestOpt.sizeKB,
                savingsBytes: forestRaw.bytes - forestOpt.bytes,
                savingsKB: formatKB(forestRaw.bytes - forestOpt.bytes),
                savingsPercent: Number(
                  (((forestRaw.bytes - forestOpt.bytes) / forestRaw.bytes) * 100).toFixed(1)
                ),
              }
            : null,
        dracoFileCount: dracoAssets.length,
        totalDracoBytes,
        totalDracoKB: formatKB(totalDracoBytes),
        usdzFileCount: usdzAssets.length,
      },
    },
    canvasMounts,
    eagerPreloads: preloadCalls,
    sceneLighting,
    contactShadows,
    preserveDrawingBufferUsages,
    environmentUsages,
    dynamicImports,
    assets: {
      glb: glbAssets,
      hdr: hdrAssets,
      draco: dracoAssets,
      usdz: usdzAssets,
    },
    staleBakFiles: bakFiles,
  };
}

const { outPath } = parseArgs();
const report = auditCodebase();
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`[audit-baseline-metrics] Baseline saved to: ${outPath}`);
console.log(JSON.stringify(report.summary, null, 2));
