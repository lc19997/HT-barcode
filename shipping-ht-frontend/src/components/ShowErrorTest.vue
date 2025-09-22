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
      if ("vibrate" in navigator) {
        // Standard vibration API
        const didVibrate = navigator.vibrate([200, 100, 200]);
        console.log("✅ Vibrate triggered:", didVibrate);
      } else {
        console.log("❌ Vibrate not supported. Trying iOS workaround...");

        // Force toggle the switch input to produce haptic on iOS 18
        this.switchState = !this.switchState;
      }
    },
    onSwitchChanged() {
      console.log("iOS switch toggled → haptic feedback (if iOS 18+).");
    },
  },
};
</script>
