import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import { createClient } from '@supabase/supabase-js';
import { SHARED_DEFAULT_MODEL_PATH, KNOWN_DISH_SLUGS } from '@/data/model-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  details?: Record<string, any>;
  error?: string;
}

const TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, CheckResult> = {};

  // 1. Convex Live Connection Check (Primary Database)
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    checks.convex = {
      status: 'unhealthy',
      error: 'NEXT_PUBLIC_CONVEX_URL environment variable is missing',
    };
  } else {
    const cStart = Date.now();
    try {
      const client = new ConvexHttpClient(convexUrl);
      const settings = await withTimeout(
        client.query(api.settings.getAllSettings, {}),
        TIMEOUT_MS,
        'Convex Query'
      );
      checks.convex = {
        status: 'healthy',
        latencyMs: Date.now() - cStart,
        details: {
          deployment: convexUrl,
          settingsConfigured: settings ? Object.keys(settings).length : 0,
        },
      };
    } catch (err: any) {
      checks.convex = {
        status: 'unhealthy',
        latencyMs: Date.now() - cStart,
        error: err?.message || 'Convex connection failed',
      };
    }
  }

  // 2. Supabase Standby Connectivity Check (Failover Database)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    checks.supabaseStandby = {
      status: 'degraded',
      error: 'Supabase credentials not configured in environment',
    };
  } else {
    const sbStart = Date.now();
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      const queryPromise = Promise.resolve(
        supabase.from('restaurant_settings').select('*', { count: 'exact', head: true })
      );
      const res = (await withTimeout(
        queryPromise,
        TIMEOUT_MS,
        'Supabase Query'
      )) as { count: number | null; error: any };
      const { count, error } = res;

      if (error) {
        checks.supabaseStandby = {
          status: 'degraded',
          latencyMs: Date.now() - sbStart,
          error: error.message,
        };
      } else {
        checks.supabaseStandby = {
          status: 'healthy',
          latencyMs: Date.now() - sbStart,
          details: {
            tableStatus: 'connected',
            recordsFound: count ?? 0,
          },
        };
      }
    } catch (err: any) {
      checks.supabaseStandby = {
        status: 'degraded',
        latencyMs: Date.now() - sbStart,
        error: err?.message || 'Supabase standby unreachable',
      };
    }
  }

  // 3. 3D Asset Availability Check
  try {
    const relativeAsset = SHARED_DEFAULT_MODEL_PATH.replace(/^\//, '');
    const modelDiskPath = path.resolve(process.cwd(), 'public', relativeAsset);
    
    if (!fs.existsSync(modelDiskPath)) {
      checks.assets3D = {
        status: 'unhealthy',
        error: `Core 3D model missing at: ${modelDiskPath}`,
      };
    } else {
      const stats = fs.statSync(modelDiskPath);
      const fd = fs.openSync(modelDiskPath, 'r');
      const headerBuf = Buffer.alloc(4);
      fs.readSync(fd, headerBuf, 0, 4, 0);
      fs.closeSync(fd);
      const magic = headerBuf.toString('ascii');

      const isGlTF = magic === 'glTF';
      const isSubstantial = stats.size > 500_000;

      checks.assets3D = {
        status: isGlTF && isSubstantial ? 'healthy' : 'degraded',
        details: {
          primaryModel: SHARED_DEFAULT_MODEL_PATH,
          sizeBytes: stats.size,
          sizeMB: Number((stats.size / (1024 * 1024)).toFixed(2)),
          binaryMagicHeader: magic,
          knownSlugsConfigured: KNOWN_DISH_SLUGS.length,
        },
        error: !isGlTF ? 'Invalid GLB magic header' : !isSubstantial ? 'Asset size below expected 500KB' : undefined,
      };
    }
  } catch (err: any) {
    checks.assets3D = {
      status: 'unhealthy',
      error: err?.message || '3D asset inspection failed',
    };
  }

  // Overall Health Status Calculation
  const isConvexHealthy = checks.convex?.status === 'healthy';
  const is3DHealthy = checks.assets3D?.status === 'healthy';
  const isSupabaseHealthy = checks.supabaseStandby?.status === 'healthy';

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let httpStatusCode = 200;

  if (!isConvexHealthy && !isSupabaseHealthy) {
    overallStatus = 'unhealthy';
    httpStatusCode = 503;
  } else if (!isConvexHealthy || !is3DHealthy) {
    overallStatus = 'degraded';
    httpStatusCode = 200;
  }

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      uptimeSeconds: Math.floor(process.uptime()),
      system: {
        nodeVersion: process.version,
        memoryUsageMb: {
          rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
        },
      },
      checks,
    },
    {
      status: httpStatusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
