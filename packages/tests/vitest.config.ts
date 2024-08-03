/// <reference types="vitest" />

import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	plugins: [solid()],
	resolve: {
		alias: {
			"@core": path.resolve(__dirname, "../core/src"),
		},
		conditions: ["development", "browser"],
	},
	test: {
		includeSource: ["src/**/*.{ts,tsx}"],
	},
});
