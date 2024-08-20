import type { RivelInternalConfig } from "@core/config";
import AutoImport from "unplugin-auto-import/vite";
import type { Plugin } from "vite";

export const rivel = (config: RivelInternalConfig): Plugin => ({
	name: "rivel",
	config: (config) => {
		if (!config.plugins) {
			config.plugins = [];
		}
		config.plugins.push(
			AutoImport({
				include: [/\.tsx?$/],
				imports: [
					{
						rivel: ["rv"],
					},
				],
			})
		);
		return config;
	},
});
