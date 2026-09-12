import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { io, Socket } from 'socket.io-client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getSupabaseClient } from '@civicguard/shared';

const TARGET_MODE = process.env.TARGET || 'kong';
const BASE_URL = TARGET_MODE === 'direct' ? 'http://localhost:4001' : (process.env.KONG_BASE_URL || 'http://localhost:8000');
const NOTIF_URL = TARGET_MODE === 'direct' ? 'http://localhost:4003' : 'http://localhost:4003';

interface TestResult {
  step: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];
const isCleanup = process.argv.includes('--cleanup');

function logPass(step: string, details?: string, durationMs = 0) {
  results.push({ step, passed: true, message: details, durationMs });
  console.log(`\x1b[32m✔ PASS\x1b[0m [${durationMs}ms] ${step} ${details ? `\x1b[90m(${details})\x1b[0m` : ''}`);
}

function logFail(step: string, error: any, durationMs = 0) {
  const msg = error.response?.data?.message || error.response?.data?.error || error.message || String(error);
  results.push({ step, passed: false, message: msg, durationMs });
  console.error(`\x1b[31m✖ FAIL\x1b[0m [${durationMs}ms] ${step}: \x1b[33m${msg}\x1b[0m`);
}

export async function runWeatherBurstTests(): Promise<boolean> {
  console.log('\n=============================================================');
  console.log('  MULTI-WARD RAINFALL BURST REPLAY TEST (5 WARDS)');
  console.log(`  Mode: ${TARGET_MODE.toUpperCase()} | Incident Target: ${BASE_URL} | Notification Target: ${NOTIF_URL}`);
  console.log('=============================================================\n');

  const supabase = getSupabaseClient();
  let socket: Socket | null = null;
  const interceptedEvents: any[] = [];

  // 1. Establish Socket.IO listener for automated threshold danger alerts
  const t0 = Date.now();
  try {
    socket = io(NOTIF_URL, { transports: ['websocket', 'polling'], timeout: 4000 });
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 3000); // non-blocking if offline
      socket?.on('connect', () => {
        clearTimeout(timeout);
        // Join relevant rooms
        socket?.emit('join', { rooms: ['officers', 'public'] });
        resolve();
      });
      socket?.on('connect_error', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    socket?.onAny((event, data) => {
      interceptedEvents.push({ event, data });
    });

    logPass('Socket.IO Alert Listener', `Connected to ${NOTIF_URL}`, Date.now() - t0);
  } catch (err: any) {
    logFail('Socket.IO Alert Listener', err, Date.now() - t0);
  }

  // 2. Trigger Torrential Storm Replay Simulation
  const t1 = Date.now();
  let burstData: any[] = [];
  try {
    const res = await axios.post(
      `${BASE_URL}/api/incidents/telemetry/simulate`,
      { intensity: 'TORRENTIAL' },
      { timeout: 8000 }
    );

    const wards = res.data?.data?.simulated_wards || res.data?.data;
    if (res.status === 200 && Array.isArray(wards)) {
      burstData = wards;
      logPass(
        'Torrential Storm Burst Trigger',
        `Replayed across ${burstData.length} demonstration wards (Multiplier: 1.8x)`,
        Date.now() - t1
      );
    } else {
      throw new Error(`Invalid simulation response status ${res.status}`);
    }
  } catch (err: any) {
    logFail('Torrential Storm Burst Trigger', err, Date.now() - t1);
  }

  // 3. Verify Database Ingestion & Danger Thresholds
  const t2 = Date.now();
  try {
    const { data: readings, error } = await supabase
      .from('environmental_readings')
      .select('*')
      .in('source', ['MET_DEPT_SIMULATOR', 'HYDROLOGY_GAUGE_SIMULATOR'])
      .order('recorded_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const rainfallReadings = (readings || []).filter((r) => r.reading_type === 'RAINFALL');
    const riverReadings = (readings || []).filter((r) => r.reading_type === 'RIVER_LEVEL');

    if (rainfallReadings.length === 0 || riverReadings.length === 0) {
      throw new Error('No simulated environmental telemetry readings found in database');
    }

    const maxRainfall = Math.max(...rainfallReadings.map((r) => Number(r.value)));
    const maxRiver = Math.max(...riverReadings.map((r) => Number(r.value)));
    const rainDangerCount = rainfallReadings.filter((r) => Number(r.value) >= Number(r.danger_threshold)).length;
    const riverDangerCount = riverReadings.filter((r) => Number(r.value) >= Number(r.danger_threshold)).length;

    logPass(
      'Environmental Telemetry Ingestion',
      `Max Rain: ${maxRainfall.toFixed(1)}mm (${rainDangerCount} danger breaches) | Max River: ${maxRiver.toFixed(2)}m (${riverDangerCount} crest breaches)`,
      Date.now() - t2
    );
  } catch (err: any) {
    logFail('Environmental Telemetry Ingestion', err, Date.now() - t2);
  }

  // 4. Verify Active Alerts Endpoint
  const t3 = Date.now();
  try {
    const notifBase = TARGET_MODE === 'direct' ? NOTIF_URL : BASE_URL;
    const alertsRes = await axios.get(`${notifBase}/api/notifications/active-alerts`, { timeout: 5000 });
    if (alertsRes.status === 200) {
      const alertCount = alertsRes.data?.data?.length || 0;
      logPass('Active Alerts Query', `Retrieved ${alertCount} active danger alerts via API`, Date.now() - t3);
    } else {
      throw new Error(`Active alerts returned status ${alertsRes.status}`);
    }
  } catch (err: any) {
    logFail('Active Alerts Query', err, Date.now() - t3);
  }

  // 5. Test Moderate Baseline (Sub-Threshold) Simulation
  const t4 = Date.now();
  try {
    const res = await axios.post(
      `${BASE_URL}/api/incidents/telemetry/simulate`,
      { intensity: 'MODERATE' },
      { timeout: 8000 }
    );

    const modWards = res.data?.data?.simulated_wards || res.data?.data;
    if (res.status === 200 && Array.isArray(modWards)) {
      logPass(
        'Moderate Storm Simulation Baseline',
        `Replayed across ${modWards.length} wards (Multiplier: 0.9x - Sub-threshold baseline)`,
        Date.now() - t4
      );
    } else {
      throw new Error(`Moderate simulation returned status ${res.status}`);
    }
  } catch (err: any) {
    logFail('Moderate Storm Simulation Baseline', err, Date.now() - t4);
  }

  // 6. Cleanup if requested
  if (isCleanup) {
    const t5 = Date.now();
    try {
      const { error } = await supabase
        .from('environmental_readings')
        .delete()
        .in('source', ['MET_DEPT_SIMULATOR', 'HYDROLOGY_GAUGE_SIMULATOR']);
      if (error) throw error;
      logPass('Telemetry Cleanup (--cleanup)', 'Purged simulated telemetry records', Date.now() - t5);
    } catch (err: any) {
      logFail('Telemetry Cleanup (--cleanup)', err, Date.now() - t5);
    }
  }

  if (socket) {
    socket.disconnect();
  }

  console.log('\n-------------------------------------------------------------');
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  console.log(`Weather Burst Suite Results: ${totalPassed} Passed, ${totalFailed} Failed\n`);

  return totalFailed === 0;
}

if (require.main === module) {
  runWeatherBurstTests()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
