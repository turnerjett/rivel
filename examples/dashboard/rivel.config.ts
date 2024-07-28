import { createConfig, type RVDirective } from "@rivel/core";
import { defaultConfig } from "@rivel/config";

export const { rv } = createConfig(defaultConfig);

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			rv: RVDirective<typeof rv>;
		}
	}
}
