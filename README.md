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
- ⚠️ virtual dom & renderer  
  - ✅ h function
  - ✅ patch function
  - hydration
- ❌ template compiler  
  - directives
    - v-if
    - v-on
    - v-for
  - binding
  - mustache
- ❌ sfc compiler
  - basic
  - script setup
    - defineProps
    - defineEmits
- ❌ extension
  - store
  - router
