import { defaultConfig } from "@rivel/config";
import { createConfig } from "@rivel/core";

export const { config } = createConfig(defaultConfig);
export type TestConfig = typeof config;

declare module "@rivel/core" {
	interface RivelConfig extends TestConfig {}
}
