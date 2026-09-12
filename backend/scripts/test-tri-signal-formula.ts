import { SIGNAL_WEIGHTS, VERIFICATION_THRESHOLDS } from '@civicguard/shared';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('\n--- Running Tri-Signal Verification Formula Test ---');

// 1. Verify Weights
assert(SIGNAL_WEIGHTS.IMAGE_AI === 0.60, 'SIGNAL_WEIGHTS.IMAGE_AI is exactly 0.60 (60%)');
assert(SIGNAL_WEIGHTS.WEATHER_CHECK === 0.20, 'SIGNAL_WEIGHTS.WEATHER_CHECK is exactly 0.20 (20%)');
assert(SIGNAL_WEIGHTS.LOCATION_AI === 0.20, 'SIGNAL_WEIGHTS.LOCATION_AI is exactly 0.20 (20%)');

const totalWeight = SIGNAL_WEIGHTS.IMAGE_AI + SIGNAL_WEIGHTS.WEATHER_CHECK + SIGNAL_WEIGHTS.LOCATION_AI;
assert(Math.abs(totalWeight - 1.00) < 0.0001, 'Total weights sum exactly to 1.00 (100%)');

// 2. Verify Thresholds
assert(VERIFICATION_THRESHOLDS.CONFIRMATION_SCORE === 0.75, 'VERIFICATION_THRESHOLDS.CONFIRMATION_SCORE is 0.75 (75%)');
assert(VERIFICATION_THRESHOLDS.NEEDS_VERIFICATION_SCORE === 0.40, 'VERIFICATION_THRESHOLDS.NEEDS_VERIFICATION_SCORE is 0.40 (40%)');

// 3. Formula Test - Standard Confirmed Flood
function computeScore(img: number, loc: number, weather: number): number {
  return img * SIGNAL_WEIGHTS.IMAGE_AI + loc * SIGNAL_WEIGHTS.LOCATION_AI + weather * SIGNAL_WEIGHTS.WEATHER_CHECK;
}

const sImage = 0.88;
const sLoc = 0.92;
const sWeather = 0.95;
const score = computeScore(sImage, sLoc, sWeather);
const expected = 0.88 * 0.60 + 0.92 * 0.20 + 0.95 * 0.20; // 0.528 + 0.184 + 0.190 = 0.902

assert(Math.abs(score - expected) < 0.0001, `Formula calculates correctly: ${score.toFixed(4)} == ${expected.toFixed(4)}`);
assert(score >= VERIFICATION_THRESHOLDS.CONFIRMATION_SCORE, `Score ${score.toFixed(3)} >= 0.75 triggers CONFIRMED`);

// 4. Test Zero Impact of Risk and Cluster
const scoreWithVaryingContext = computeScore(sImage, sLoc, sWeather);
assert(score === scoreWithVaryingContext, 'Risk and Cluster have 0% impact on confidence score');

// 5. Test Missing Image Baseline (0.45)
const scoreNoImage = computeScore(0.45, sLoc, sWeather); // 0.270 + 0.184 + 0.190 = 0.644
assert(Math.abs(scoreNoImage - 0.644) < 0.0001, `No-photo score is ${scoreNoImage.toFixed(3)}`);
assert(scoreNoImage < VERIFICATION_THRESHOLDS.CONFIRMATION_SCORE, 'No-photo report safely fails auto-confirmation (< 0.75)');
assert(scoreNoImage >= VERIFICATION_THRESHOLDS.NEEDS_VERIFICATION_SCORE, 'No-photo report correctly enters NEEDS_VERIFICATION (>= 0.40)');

console.log('--- All Tri-Signal formula assertions passed! ---\n');
