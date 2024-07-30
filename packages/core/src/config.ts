import { type Accessor, createContext, useContext } from "solid-js";
import type {
	Styles,
	CSSPropertyShorthands,
	MapShorthands,
	SpecialProperties,
} from "./types";
import { themeProviderFromContext } from "./theme";
import { generateStyleSheets } from "./css";
import { withElevation, withStaticProperties } from "./utils";
import { rvStylesWithConfig } from "./rv";

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
	BP extends Breakpoints | undefined
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
	config.options = Object.assign(
		{
			cssSizeUnit: "rem",
			cssTimeUnit: "ms",
		},
		config.options
	);

	const defaultTheme = Object.keys(config.themes)[0] as TK;
	if (!defaultTheme) {
		throw new Error("Config must specify at least one theme");
	}
	const defaultScheme = Object.keys(config.palettes)[0] as SK;
	if (!defaultScheme || !config.palettes[defaultScheme]) {
		throw new Error("Config must specify at least one scheme and palette");
	}

	const ThemeContext = createContext<{
		scheme: Accessor<SK>;
		theme: Accessor<TK>;
		elevation: Accessor<number>;
	}>({
		scheme: () => defaultScheme,
		theme: () => defaultTheme,
		elevation: () => 0,
	});

	const values = Object.keys(config.values({ palette: [] })).reduce(
		(acc, key) => {
			Object.assign(acc, {
				[key]: () => {
					const { scheme, theme } = useContext(ThemeContext);
					const themePalette = config.themes[theme()].palette;
					const palette = withElevation(
						config.palettes[scheme()][themePalette],
						useContext(ThemeContext).elevation()
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

	const rv = withStaticProperties(
		(
			el: Element,
			styles: Accessor<MergedStyles & SpecialProperties<MergedStyles, BP>>
		) => rvStylesWithConfig<MergedStyles, BP>(el, styles, config),
		{
			...values,
			Theme: themeProviderFromContext<typeof config>(ThemeContext),
		}
	);

	return { config, rv };
};
