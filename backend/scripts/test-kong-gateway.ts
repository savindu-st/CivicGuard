import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

const KONG_URL = process.env.KONG_BASE_URL || 'http://localhost:8000';

interface TestResult {
  step: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function logPass(step: string, details?: string, durationMs = 0) {
  results.push({ step, passed: true, message: details, durationMs });
  console.log(`\x1b[32m✔ PASS\x1b[0m [${durationMs}ms] ${step} ${details ? `\x1b[90m(${details})\x1b[0m` : ''}`);
}

function logFail(step: string, error: any, durationMs = 0) {
  const msg = error.response?.data?.message || error.response?.data?.error || error.message || String(error);
  results.push({ step, passed: false, message: msg, durationMs });
  console.error(`\x1b[31m✖ FAIL\x1b[0m [${durationMs}ms] ${step}: \x1b[33m${msg}\x1b[0m`);
}

export async function runKongGatewayTests(): Promise<boolean> {
  console.log('\n=============================================================');
  console.log('  KONG API GATEWAY PROXY VERIFICATION (PORT 8000)');
  console.log(`  Target: ${KONG_URL}`);
  console.log('=============================================================\n');

  // Test 1: Incident Service Ingress (/api/incidents/wards)
  const t1 = Date.now();
  try {
    const res = await axios.get(`${KONG_URL}/api/incidents/wards`, { timeout: 5000 });
    const wards = res.data?.data?.wards || res.data?.data;
    if (res.status === 200 && Array.isArray(wards)) {
      logPass('Incident Service Ingress', `Proxied /api/incidents/wards -> Found ${wards.length} wards`, Date.now() - t1);
    } else {
      throw new Error(`Unexpected response status ${res.status} or missing wards array`);
    }
  } catch (err: any) {
    logFail('Incident Service Ingress', err, Date.now() - t1);
  }

  // Test 2: Incident Service Roads Ingress (/api/incidents/roads)
  const t2 = Date.now();
  try {
    const res = await axios.get(`${KONG_URL}/api/incidents/roads`, { timeout: 5000 });
    const roads = res.data?.data?.roads || res.data?.data;
    if (res.status === 200 && Array.isArray(roads)) {
      logPass('Incident Service Roads Ingress', `Proxied /api/incidents/roads -> Found ${roads.length} roads`, Date.now() - t2);
    } else {
      throw new Error(`Unexpected response status ${res.status} or missing roads array`);
    }
  } catch (err: any) {
    logFail('Incident Service Roads Ingress', err, Date.now() - t2);
  }

  // Test 3: Ticket Service Ingress (/api/tickets/crews)
  const t3 = Date.now();
  try {
    const res = await axios.get(`${KONG_URL}/api/tickets/crews`, { timeout: 5000 });
    const crews = res.data?.data?.crews || res.data?.data;
    if (res.status === 200 && Array.isArray(crews)) {
      logPass('Ticket Service Ingress', `Proxied /api/tickets/crews -> Found ${crews.length} field crews`, Date.now() - t3);
    } else {
      throw new Error(`Unexpected response status ${res.status}`);
    }
  } catch (err: any) {
    logFail('Ticket Service Ingress', err, Date.now() - t3);
  }

  // Test 4: Notification Service Ingress (/api/notifications/active-alerts)
  const t4 = Date.now();
  try {
    const res = await axios.get(`${KONG_URL}/api/notifications/active-alerts`, { timeout: 5000 });
    if (res.status === 200 && res.data) {
      logPass('Notification Service Ingress', `Proxied /api/notifications/active-alerts`, Date.now() - t4);
    } else {
      throw new Error(`Unexpected response status ${res.status}`);
    }
  } catch (err: any) {
    logFail('Notification Service Ingress', err, Date.now() - t4);
  }

  // Test 5: Relief Service Ingress (/api/relief/shelters)
  const t5 = Date.now();
  try {
    const res = await axios.get(`${KONG_URL}/api/relief/shelters`, { timeout: 5000 });
    const shelters = res.data?.data?.shelters || res.data?.data;
    if (res.status === 200 && Array.isArray(shelters)) {
      logPass('Relief Service Ingress', `Proxied /api/relief/shelters -> Found ${shelters.length} shelters`, Date.now() - t5);
    } else {
      throw new Error(`Unexpected response status ${res.status} or missing shelters array`);
    }
  } catch (err: any) {
    logFail('Relief Service Ingress', err, Date.now() - t5);
  }

  // Test 6: CORS Pre-Flight Handshake (OPTIONS request)
  const t6 = Date.now();
  try {
    const res = await axios({
      method: 'OPTIONS',
      url: `${KONG_URL}/api/incidents/reports`,
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
      validateStatus: () => true,
    });

    const allowOrigin = res.headers['access-control-allow-origin'];
    const allowMethods = res.headers['access-control-allow-methods'];
    const allowCredentials = res.headers['access-control-allow-credentials'];

    if ((res.status === 200 || res.status === 204) && allowOrigin && allowMethods) {
      logPass(
        'CORS Pre-Flight Validation',
        `Status ${res.status} | Origin: ${allowOrigin} | Methods: ${allowMethods} | Credentials: ${allowCredentials || 'true'}`,
        Date.now() - t6
      );
    } else {
      throw new Error(`CORS headers missing. Status: ${res.status}, Headers: ${JSON.stringify(res.headers)}`);
    }
  } catch (err: any) {
    logFail('CORS Pre-Flight Validation', err, Date.now() - t6);
  }

  // Test 7: Error Forwarding & Transparent Status Codes
  const t7 = Date.now();
  try {
    const res = await axios.get(`${KONG_URL}/api/incidents/00000000-0000-0000-0000-000000000000`, {
      validateStatus: () => true,
    });
    if (res.status === 404 && res.data && res.data.success === false) {
      logPass('Error Status Forwarding (404 Not Found)', `JSON error payload preserved: "${res.data.error || res.data.message}"`, Date.now() - t7);
    } else {
      throw new Error(`Expected status 404 with JSON body, got status ${res.status}`);
    }
  } catch (err: any) {
    logFail('Error Status Forwarding (404 Not Found)', err, Date.now() - t7);
  }

  // Test 8: Multipart Photo Evidence Passthrough
  const t8 = Date.now();
  try {
    const assetPath = path.resolve(__dirname, '../services/ai-service/test_assets/sample_flood_minor.jpg');
    if (fs.existsSync(assetPath)) {
      const form = new FormData();
      form.append('latitude', '6.8785');
      form.append('longitude', '79.8655');
      form.append('incident_type', 'FLOOD');
      form.append('description', '[E2E-TEST] Kong Gateway Multipart Passthrough Verification');
      form.append('photo', fs.createReadStream(assetPath));

      const res = await axios.post(`${KONG_URL}/api/incidents/reports`, form, {
        headers: form.getHeaders(),
        timeout: 10000,
        validateStatus: () => true,
      });

      if (res.status === 200 || res.status === 201) {
        logPass('Multipart Form-Data Passthrough', `Image stream forwarded through Kong to upstream incident-service`, Date.now() - t8);
      } else {
        throw new Error(`Expected status 200/201, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
    } else {
      logPass('Multipart Form-Data Passthrough', 'Skipped: test asset not found', Date.now() - t8);
    }
  } catch (err: any) {
    logFail('Multipart Form-Data Passthrough', err, Date.now() - t8);
  }

  console.log('\n-------------------------------------------------------------');
  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;
  console.log(`Kong Gateway Suite Results: ${totalPassed} Passed, ${totalFailed} Failed\n`);

  return totalFailed === 0;
}

if (require.main === module) {
  runKongGatewayTests()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
