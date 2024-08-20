import { createConfig, defaultConfig } from "rivel";

export const config = createConfig(defaultConfig);

type RivelCustomConfig = typeof config;
declare module "@rivel/core" {
	export interface RivelConfig extends RivelCustomConfig {}
}
