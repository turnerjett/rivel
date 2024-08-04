import type { RivelInternalConfig } from "./config";
import { useRivel } from "./root-provider";
import { useTheme } from "./theme";
import { withElevation } from "./utils";

type ConfigValueKeys = ReturnType<RivelInternalConfig["values"]>;

type GetAccessors = {
	[key in keyof ConfigValueKeys]: ConfigValueKeys[key];
};

const handler: ProxyHandler<GetAccessors> = {
	get(_, prop) {
		const root = useRivel();
		if (!root) {
			throw new Error("Rivel must be used within a RivelProvider");
		}
		const config = root.config();
		const themeContext = useTheme();
		const theme = themeContext?.theme() ?? root.default.theme();
		const scheme = themeContext?.scheme() ?? root?.default.scheme();
		const elevation = themeContext?.elevation() ?? 0;
		const themePalette =
			config.themes[theme as keyof typeof config.themes]?.palette;
		if (!themePalette) {
			throw new Error(`Theme ${theme} not found`);
		}
		const palette = withElevation(
			config.palettes[scheme as keyof typeof config.palettes]?.[themePalette] ??
				[],
			elevation
		);
		return config.values({
			palette,
		})[prop as keyof ConfigValueKeys];
	},
};

export const values: GetAccessors = new Proxy({} as GetAccessors, handler);
