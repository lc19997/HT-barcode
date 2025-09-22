<template>
  <div class="p-4">
    <!-- Trigger button -->
    <button
      ref="vibrateBtn"
      class="px-4 py-2 bg-blue-500 text-white rounded-lg transition-transform"
      @click="triggerVibration"
    >
      Vibrate (if supported)
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    triggerVibration() {
      this.playBeep(); // always beep on click

      if ("vibrate" in navigator) {
        // Standard vibration API (Android, some browsers)
        const didVibrate = navigator.vibrate([200, 100, 200]);
        console.log("✅ Vibrate triggered:", didVibrate);
      } else {
        console.log("❌ Vibrate not supported. Using shake fallback...");

        // Apply shake animation as fallback
        this.shakeFallback();
      }
    },
    shakeFallback() {
      const btn = this.$refs.vibrateBtn;
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 400);
    },
    playBeep() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine"; // smoother alert-like tone
        osc.frequency.value = freq;

        // Smooth fade out
        gainNode.gain.setValueAtTime(1, ctx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + start + duration
        );

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Error-like sound: high → low beep
      playTone(800, 0, 0.15);
      playTone(500, 0.18, 0.15);

      setTimeout(() => ctx.close(), 500);
    },
  },
};
</script>

<style scoped>
/* Shake animation fallback */
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(1px); }
  100% { transform: translateX(0); }
}

.shake {
  animation: shake 0.4s ease-in-out;
}
</style>
