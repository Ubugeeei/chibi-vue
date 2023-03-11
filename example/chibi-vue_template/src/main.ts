// @ts-nocheck
import { createApp } from "chibi-vue";

const app = createApp({
  data() {
    return {
      message: "Hello chibi-vue!",
      count: 0,
    };
  },
  methods: {
    changeMessage() {
      this.count++;
      this.message = `Hello chibi-vue! ${this.count} * 2 = ${this.countDouble}`;
    },
  },
  computed: {
    countDouble() {
      return this.count * 2;
    },
  },
  template:
    '<div class="my-class" v-on:click="changeMessage">{{ message }}</div>',
});

app.mount("#app");
