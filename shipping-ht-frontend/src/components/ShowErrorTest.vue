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
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Oscillator setup
      osc.type = "square";
      osc.frequency.value = 440; // Hz (A4)

      // Smooth fade out to prevent double-beep effect
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      // Connect oscillator → gain → destination
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Start/stop
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);

      // Clean up
      osc.onended = () => ctx.close();
    }
  },
};
</script>
