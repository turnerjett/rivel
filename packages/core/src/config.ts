import type {
	Styles,
	CSSPropertyShorthands,
	MapShorthands,
	SpecialProperties,
} from "./types";
import { generateStyleSheets } from "./css";

export type ConfigPalettes<SK extends string, PK extends string> = {
	[key in SK]: {
		[key in PK]: string[];
	};
};

export type ConfigThemes<TK extends string, PK extends string> = {
	[key in TK]: {
		palette: PK;
	};
};

export type ConfigValues = Record<string, unknown>;

export type ConfigBreakpoints = Record<string, number>;

export interface Config<
	SK extends string,
	PK extends string,
	TK extends string,
	V extends ConfigValues,
	SH extends CSSPropertyShorthands | undefined,
	BP extends ConfigBreakpoints | undefined,
	RV = Styles & SpecialProperties<Styles, ConfigBreakpoints>
> {
	palettes: ConfigPalettes<SK, PK>;
	themes: ConfigThemes<TK, NoInfer<PK>>;
	values: (theme: { palette: string[] }) => V;
	shorthands?: SH;
	breakpoints?: BP;
	options?: {
		cssSizeUnit?: "rem" | "px";
		cssTimeUnit?: "s" | "ms";
	};
	RVDirective?: RV;
}

export type GenericConfig = Config<
	string,
	string,
	string,
	Record<string, unknown>,
	CSSPropertyShorthands,
	ConfigBreakpoints
>;

export const createConfig = <
	SK extends string,
	PK extends string,
	TK extends string,
	V extends ConfigValues,
	SH extends CSSPropertyShorthands | undefined,
	BP extends ConfigBreakpoints | undefined
>(
	config: Config<SK, PK, TK, V, SH, BP>
) => {
	if (!config.options) {
		config.options = {};
	}
	config.options = {
		cssSizeUnit: "rem",
		cssTimeUnit: "ms",
		...config.options,
	};

	const defaultTheme = Object.keys(config.themes)[0] as TK;
	if (!defaultTheme) {
		throw new Error("Config must specify at least one theme");
	}
	const defaultScheme = Object.keys(config.palettes)[0] as SK;
	if (!defaultScheme || !config.palettes[defaultScheme]) {
		throw new Error("Config must specify at least one scheme and palette");
	}

	if (config.breakpoints) {
		const sorted = Object.entries(config.breakpoints).sort(
			(a, b) => a[1] - b[1]
		);
		config.breakpoints = Object.fromEntries(sorted) as BP;
	}
	if (typeof window !== "undefined") {
		const stylesheet =
			document.querySelector("style[data-rivel]") ||
			document.querySelector("style[data-rivel-breakpoints]");
		if (!stylesheet) generateStyleSheets(config);
	}

	type MergedStyles = SH extends undefined
		? Styles
		: Styles & MapShorthands<SH>;
	type AllProperties = MergedStyles & SpecialProperties<MergedStyles, BP>;

	return config as Config<SK, PK, TK, V, SH, BP, AllProperties>;
};

// biome-ignore lint/suspicious/noEmptyInterface: overridden by declare module
export interface RivelConfig {}
export interface RivelInternalConfig
	extends Omit<GenericConfig, keyof RivelConfig>,
		RivelConfig {}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			rv: RivelInternalConfig["RVDirective"];
		}
	}
}
