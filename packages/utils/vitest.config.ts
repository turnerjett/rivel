/// <reference types="vitest" />

import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [solid()],
	resolve: {
		conditions: ["development", "browser"],
	},
	test: {
		includeSource: ["src/**/*.{ts,tsx}"],
	},
});
