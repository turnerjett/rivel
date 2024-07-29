import {
	type Accessor,
	createContext,
	createRenderEffect,
	useContext,
} from "solid-js";
import type { Styles, CSSPropertyShorthands, MapShorthands } from "./types";
import { themeProviderFromContext } from "./theme";
import { generateAtomicClassNames, generateStyleSheets } from "./css";
import { withElevation, withStaticProperties } from "./utils";
import type { SimplePseudos } from "csstype";

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

// SK = Scheme Key
// PK = Palette Key
// TK = Theme Key
// V = Values
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
		generateStyleSheets(config);
	}

	type MergedStyles = SH extends undefined
		? Styles
		: Styles & MapShorthands<SH>;

	const rv = withStaticProperties(
		(
			el: Element,
			styles: Accessor<MergedStyles & SpecialProperties<MergedStyles, BP>>
		) => rvStylesWithConfig(el, styles, config),
		{
			...values,
			Theme: themeProviderFromContext<typeof config>(ThemeContext),
		}
	);

	return { config, rv };
};

const rvStylesWithConfig = <
	C extends GenericConfig,
	S extends Styles,
	BP extends Breakpoints
>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: C
) => {
	let prevClassNames: string[] = [];
	createRenderEffect(() => {
		const classNames = generateAtomicClassNames(styles(), config);
		if (prevClassNames.length > 0) {
			const removed = prevClassNames.filter(
				(className) => !classNames.includes(className)
			);
			el.classList.remove(...removed);
		}
		el.classList.add(...classNames);
		prevClassNames = classNames;
	});
};

export type SpecialProperties<
	S,
	BP extends Breakpoints | undefined
> = BaseSpecialProperties<S> &
	(BP extends undefined
		? never
		: MapSpecialProperties<{
				[key in keyof BP]: S & BaseSpecialProperties<S>;
		  }>);

type BaseSpecialProperties<S> = MapSpecialProperties<{
	select: Partial<Record<SimplePseudos, S>>;
}>;

type MapSpecialProperties<S extends Record<string, unknown>> = {
	[K in keyof S as `$${string & K}`]?: S[K];
};

type GetSecondArg<T> = T extends (...args: infer P) => unknown ? P[1] : never;
type GetAccessorType<T> = T extends (...args: unknown[]) => infer P ? P : never;
export type RVDirective<RV> = GetAccessorType<GetSecondArg<RV>>;
