import * as _compiler from "../../compiler-sfc";

import type { Plugin } from "vite";
import { createFilter } from "vite";
import { transformMain } from "./main";

export interface ResolvedOptions {
  compiler: typeof _compiler;
  root: string;
}

export default function chibiVuePlugin(): Plugin {
  const filter = createFilter(/\.vue$/);
  const options: ResolvedOptions = {
    compiler: _compiler,
    root: process.cwd(),
  };

  return {
    name: "vite:chibi-vue",
    transform(code, id, _) {
      if (!filter(id)) return;
      return transformMain(code, id, options, this);
    },
  };
}
