import { runKongGatewayTests } from './test-kong-gateway';
import { runWeatherBurstTests } from './test-weather-burst';
import { runE2EClosedLoopTest } from './test-e2e-closed-loop';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CIVIC GUARD — PHASE 4 MASTER VERIFICATION SUITE        ║');
  console.log('║  Integration, Gateway Routing, Telemetry & Closed-Loop Test  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startAll = Date.now();
  const summary: { name: string; passed: boolean; durationMs: number }[] = [];

  // Suite 1: Kong API Gateway Ingress (Port 8000)
  const t1 = Date.now();
  const kongPassed = await runKongGatewayTests();
  summary.push({ name: 'Kong API Gateway Proxy (Port 8000)', passed: kongPassed, durationMs: Date.now() - t1 });

  // Suite 2: Multi-Ward Weather Burst Replay
  const t2 = Date.now();
  const weatherPassed = await runWeatherBurstTests();
  summary.push({ name: 'Multi-Ward Weather Burst Replay (5 Wards)', passed: weatherPassed, durationMs: Date.now() - t2 });

  // Suite 3: End-to-End Closed-Loop Workflow Runner
  const t3 = Date.now();
  const e2ePassed = await runE2EClosedLoopTest();
  summary.push({ name: 'End-to-End Closed-Loop Workflow Runner', passed: e2ePassed, durationMs: Date.now() - t3 });

  // Final Summary Dashboard
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║               PHASE 4 VERIFICATION SCORECARD                 ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  for (const s of summary) {
    const status = s.passed ? '\x1b[32m✔ PASSED\x1b[0m' : '\x1b[31m✖ FAILED\x1b[0m';
    const padding = ' '.repeat(Math.max(1, 44 - s.name.length));
    console.log(`║ ${s.name}${padding}${status} [${s.durationMs}ms] ║`);
  }
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const allPassed = summary.every((s) => s.passed);
  const totalDuration = ((Date.now() - startAll) / 1000).toFixed(2);

  if (allPassed) {
    console.log(`\n\x1b[32m🎉 ALL PHASE 4 INTEGRATION SUITES PASSED SUCCESSFULLY in ${totalDuration}s!\x1b[0m\n`);
    process.exit(0);
  } else {
    console.error(`\n\x1b[31m⚠️ ONE OR MORE PHASE 4 SUITES FAILED in ${totalDuration}s. Review logs above.\x1b[0m\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
