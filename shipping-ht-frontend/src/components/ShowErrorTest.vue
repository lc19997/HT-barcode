<template>
  <div class="test">
    <h1>showError Test (Vue)</h1>
    <button @click="triggerError">Trigger Error</button>
  </div>
</template>

<script setup>
import { ref } from "vue";

const showTenkey = ref(true);

const playBeep = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

const showError = (msg) => {
  // アラート音
  const audio = new Audio("/error.mp3");
  audio.play().catch(() => {
    console.log("⚠️ Audio play failed, playing beep instead");
    playBeep();
  });

  // バイブレーション
  if (navigator.vibrate) {
    const didVibrate = navigator.vibrate([200, 100, 200]);
    console.log("✅ Vibrate triggered:", didVibrate);
  } else {
    console.log("❌ Vibrate not supported");
  }

  alert(msg);
  showTenkey.value = false;
};

const triggerError = () => {
  showError("テストエラー発生！");
};
</script>

<style scoped>
.test {
  padding: 20px;
  font-family: sans-serif;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
