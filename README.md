# chibi-vue

chibi-vue is minimam [Vue.js v3](https://github.com/vuejs/core) core implementations (reaactivity, vnode, component, compiler).

"chibi" means "small" in Japanese.

This project began in February 2023 with the goal of simplifying the understanding of Vue's core implementation.

Currently, I am still in the process of implementation, but after implementation, I intend to post explanatory articles as well.

(For now, I plan to post Japanese first.)

<br/>
<br/>
<br/>

## status

- ✅ reactive system
  - ✅ reactive
  - ✅ ref
  - ✅ computed
- ✅ virtual dom & renderer
  - ✅ h function
  - ✅ patch rendering
- ✅ API
  - ✅ Options API
  - ✅ Composition API
- ✅ template compiler
  - ✅ directives
    - ✅ v-on
  - ✅ mustache
- extension
  - sfc compiler (vite plugin)
    - ⚠️ basic
    - ❌ script setup
  - ❌ store
  - ❌ router
