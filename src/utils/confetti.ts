import confetti from 'canvas-confetti';

export function triggerApprovalConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#10B981', '#059669', '#34D399', '#F59E0B'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#6366F1', '#4F46E5', '#10B981'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ['#E0E7FF', '#FEF3C7', '#A7F3D0'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
