import { createApp, ref, computed, h } from "chibi-vue";

const app = createApp({
  template: `<div class="my-class" v-on:click="changeMessage">{{ message }}</div>`,

  setup() {
    const count = ref(0);
    const countDouble = computed(() => count.value * 2);
    const message = ref("Hello chibi-vue!");
    const changeMessage = () => {
      count.value++;
      message.value = `Hello chibi-vue! ${count.value} * 2 = ${countDouble.value}`;
    };
    return { message, changeMessage };
  },
});

app.mount("#app");
