import { createConfig, type RVDirective } from "@rivel/core";
import { defaultConfig } from "@rivel/config";

export const { rv, config } = createConfig(defaultConfig);

type CustomRivelConfig = typeof config;
declare module "@rivel/core" {
	export interface RivelConfig extends CustomRivelConfig {}
}
