<template>
  <div class="p-4">
    <!-- Normal vibration trigger button -->
    <button
      class="px-4 py-2 bg-blue-500 text-white rounded-lg"
      @click="triggerVibration"
    >
      Vibrate (if supported)
    </button>

    <!-- iOS 18 workaround: hidden switch toggle -->
    <input
      id="ios-switch"
      type="checkbox"
      switch
      v-model="switchState"
      @change="onSwitchChanged"
      class="hidden"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      switchState: false,
    };
  },
    methods: {
        triggerVibration() {
            this.playBeep();
            if ("vibrate" in navigator) {
                // Standard vibration API
                const didVibrate = navigator.vibrate([200, 100, 200]);
                console.log("✅ Vibrate triggered:", didVibrate);
            } else {
                console.log("❌ Vibrate not supported. Trying iOS workaround...");

                // Force toggle the switch input (iOS 18 haptic)
                this.switchState = !this.switchState;

                // Fallback beep if no haptic

            }
        },
        onSwitchChanged() {
            console.log("iOS switch toggled → haptic feedback (if iOS 18+).");
        },
        playBeep() {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            const playTone = (freq, start, duration) => {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();

                osc.type = "sine";        // smoother sound
                osc.frequency.value = freq;

                // fade out to avoid clicks
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

            // Two short tones: 800Hz then 500Hz
            playTone(800, 0, 0.15);
            playTone(500, 0.18, 0.15);

            // Auto close after ~0.4s
            setTimeout(() => ctx.close(), 500);
        },
    },
};
</script>
