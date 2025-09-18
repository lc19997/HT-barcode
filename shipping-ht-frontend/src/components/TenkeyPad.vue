<template>
  <div class="tenkey-overlay">
    <div class="tenkey-container">
      <input
        v-model="displayValue"
        type="text"
        class="tenkey-display"
        readonly
        placeholder=""
      />
      <div class="tenkey-grid">
        <button v-for="num in [7, 8, 9]" :key="num" @click="appendNumber(num)" class="tenkey-btn">
          {{ num }}
        </button>
        <button v-for="num in [4, 5, 6]" :key="num" @click="appendNumber(num)" class="tenkey-btn">
          {{ num }}
        </button>
        <button v-for="num in [1, 2, 3]" :key="num" @click="appendNumber(num)" class="tenkey-btn">
          {{ num }}
        </button>
        <button @click="deleteLast" class="tenkey-btn delete">delete</button>
        <button @click="appendNumber(0)" class="tenkey-btn">0</button>
        <button @click="handleEnter" class="tenkey-btn enter">enter</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const displayValue = ref('');
const emit = defineEmits(['enter', 'close']);

const appendNumber = (num) => {
  displayValue.value += num;
};

const deleteLast = () => {
  displayValue.value = displayValue.value.slice(0, -1);
};

const handleEnter = () => {
  if (displayValue.value) {
    emit('enter', displayValue.value);
    displayValue.value = ''; // Clear after enter
  }
};

defineExpose({
  close: () => {
    displayValue.value = '';
    emit('close');
  }
});
</script>

<style scoped>
.tenkey-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.tenkey-container {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 15px;
  width: 280px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tenkey-display {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: right;
  box-sizing: border-box;
}

.tenkey-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.tenkey-btn {
  padding: 15px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.tenkey-btn:hover {
  background: #f0f0f0;
}

.delete {
  grid-column: span 1;
  color: #d9534f;
}

.enter {
  grid-column: span 1;
  color: #5cb85c;
}
</style>