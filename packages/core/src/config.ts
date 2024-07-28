import {
	type Accessor,
	createContext,
	createRenderEffect,
	useContext,
} from "solid-js";
import type { Styles, CSSPropertyShorthands, MapShorthands } from "./types";
import { themeProviderFromContext } from "./theme";
import { generateAtomicClassNames } from "./css";
import { withElevation, withStaticProperties } from "./utils";

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

export interface Config<
	SK extends string,
	PK extends string,
	TK extends string,
	V extends Values,
	SH extends CSSPropertyShorthands | undefined
> {
	palettes: Palettes<SK, PK>;
	themes: Themes<TK, NoInfer<PK>>;
	values: (theme: { palette: string[] }) => V;
	shorthands?: SH;
}

export type GenericConfig = Config<
	string,
	string,
	string,
	Record<string, unknown>,
	CSSPropertyShorthands
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
	SH extends CSSPropertyShorthands | undefined
>(
	config: Config<SK, PK, TK, V, SH>
) => {
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

	type MergedStyles = SH extends undefined
		? Styles
		: Styles & MapShorthands<SH>;

	const rv = withStaticProperties(
		(el: Element, styles: Accessor<MergedStyles>) =>
			rvStylesWithConfig(el, styles, config),
		{
			...values,
			Theme: themeProviderFromContext<typeof config>(ThemeContext),
		}
	);

	return { config, rv };
};

const rvStylesWithConfig = <C extends GenericConfig>(
	el: Element,
	styles: Accessor<Styles>,
	config: C
) => {
	let prevClassNames: string[] = [];
	createRenderEffect(() => {
		if (prevClassNames.length > 0) {
			el.classList.remove(...prevClassNames);
		}
		const classNames = generateAtomicClassNames(styles(), config.shorthands);
		el.classList.add(...classNames);
		prevClassNames = classNames;
	});
};

type GetSecondArg<T> = T extends (...args: infer P) => unknown ? P[1] : never;
type GetAccessorType<T> = T extends (...args: unknown[]) => infer P ? P : never;
export type RVDirective<RV> = GetAccessorType<GetSecondArg<RV>>;
