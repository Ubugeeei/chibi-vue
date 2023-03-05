// @ts-nocheck
import { computed, createApp, h, ref } from "chibi-vue";

const app = createApp({
  setup() {
    const count = ref(0);
    const countDouble = computed(() => count.value * 2);

    const message = ref("");
    const changeMessage = () => {
      count.value++;
      message.value = `Hello chibi-vue! ${count.value} * 2 = ${countDouble.value}`;
    };

    return { count, countDouble, message, changeMessage };
  },
  render() {
    return h(
      "div",
      {
        onClick: this.changeMessage,
      },
      this.message
    );
  },
});

app.mount("#app");
