import { createConfig } from "@rivel/core";
import { defaultConfig } from "@rivel/config";

export const config = createConfig(defaultConfig);

type RivelCustomConfig = typeof config;
declare module "@rivel/core" {
	export interface RivelConfig extends RivelCustomConfig {}
}
