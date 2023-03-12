import { defineConfig } from "vite";
import chibiVue from "../../vite-plugin";

console.log(`${process.cwd()}/../../example`);

export default defineConfig({
	root: `${process.cwd()}/../../example/chibi-vue_sfc`,
	resolve: {
		alias: {
			"~": process.cwd(),
			"chibi-vue": `${process.cwd()}/../../packages`,
		},
	},
	define: {
		"import.meta.vitest": "undefined",
	},
	plugins: [chibiVue()],
});
