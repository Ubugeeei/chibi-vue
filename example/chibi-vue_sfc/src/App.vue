<script>
import { ref, computed, onMounted } from "chibi-vue";

export default {
  setup() {
    const count = ref(0);
    const countDouble = computed(() => count.value * 2);
    const message = ref("Hello chibi-vue!");
    const changeMessage = () => {
      count.value++;
      message.value = `Hello chibi-vue! ${count.value} * 2 = ${countDouble.value}`;
    };

    onMounted(() => {
      console.log("mounted!");
    });
    return { message, changeMessage };
  },
};
</script>

<template>
  <div @click="changeMessage">{{ message }}</div>
</template>
