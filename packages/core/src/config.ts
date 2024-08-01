import { type Accessor, createContext, useContext } from "solid-js";
import type {
	Styles,
	CSSPropertyShorthands,
	MapShorthands,
	SpecialProperties,
} from "./types";
import { useTheme } from "./theme";
import { generateStyleSheets } from "./css";
import { withElevation, withStaticProperties } from "./utils";
import { rvStylesWithConfig } from "./rv";
import { useRivel } from "./root-provider";

export type Palettes<SK extends string, PK extends string> = {
	[key in SK]: {
		[key in PK]: string[];
	};
};

export type Themes<TK extends string, PK extends string> = {
	[key in TK]: {
		palette: PK;
	};
};

export type Values = Record<string, unknown>;

export type Breakpoints = Record<string, number>;

export interface Config<
	SK extends string,
	PK extends string,
	TK extends string,
	V extends Values,
	SH extends CSSPropertyShorthands | undefined,
	BP extends Breakpoints | undefined,
	RV = unknown
> {
	palettes: Palettes<SK, PK>;
	themes: Themes<TK, NoInfer<PK>>;
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
	Breakpoints
>;

export const createConfig = <
	SK extends string,
	PK extends string,
	TK extends string,
	V extends Values,
	SH extends CSSPropertyShorthands | undefined,
	BP extends Breakpoints | undefined
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

	const values = Object.keys(config.values({ palette: [] })).reduce(
		(acc, key) => {
			Object.assign(acc, {
				[key]: () => {
					const root = useRivel();
					const themeContext = useTheme();
					const theme = themeContext?.theme() ?? root.default.theme;
					const scheme = themeContext?.scheme() ?? root.default.scheme;
					const elevation = themeContext?.elevation() ?? 0;
					const themePalette =
						config.themes[theme as keyof typeof config.themes].palette;
					const palette = withElevation(
						config.palettes[scheme as keyof typeof config.palettes][
							themePalette
						],
						elevation
					);
					return config.values({
						palette,
					})[key];
				},
			});
			return acc;
		},
		{} as {
			[key in keyof V]: Accessor<V[key]>;
		}
	);

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

	const rv = withStaticProperties(
		(el: Element, styles: Accessor<AllProperties>) =>
			rvStylesWithConfig<MergedStyles, BP>(el, styles, config),
		{
			...values,
		}
	);
	const conf = config as Config<SK, PK, TK, V, SH, BP, AllProperties>;
	return { config: conf, rv };
};

// biome-ignore lint/suspicious/noEmptyInterface: overriden by declare module
export interface RivelConfig {}

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			rv: RivelConfig["RVDirective"];
		}
	}
}
