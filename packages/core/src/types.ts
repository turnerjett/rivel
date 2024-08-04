import type * as CSS from "csstype";
import type { RivelInternalConfig } from "./config";

export type CSSProperties = CSS.StandardProperties<
	string | number,
	string | number
>;
export type CSSPropertyKeys = keyof CSSProperties;

export type Vars = Record<`--${string}`, string | number | undefined>;
export type Styles = CSSProperties & Vars;
export type StyleKeys = keyof Styles;

export interface Variants<S extends GenericStyles> {
	readonly [key: string]: {
		readonly [key: string | "true" | "false"]: S;
	};
}

export type VariantsKV<S extends GenericStyles, V extends Variants<S>> = {
	readonly [key in keyof V]?: keyof V[key] extends "true"
		? true
		: keyof V[key] extends "false"
		? false
		: keyof V[key];
};

export type GenericStyles = Record<string, unknown>;

export type CSSPropertyShorthands = Record<
	string,
	CSSPropertyKeys | CSSPropertyKeys[]
>;

export type MapShorthands<T> = {
	[K in keyof T as K]?: T[K] extends CSSPropertyKeys
		? CSSProperties[T[K]]
		: T[K] extends CSSPropertyKeys[]
		? CSSProperties[T[K][number]]
		: never;
};

type SimplePseudos =
	| CSS.SimplePseudos
	| `:${string}:${string}`
	| `::${string}:${string}`;
type SimplePseudoClasses = Exclude<SimplePseudos, `::${string}`>;

export type BaseSpecialProperties<S> = MapSpecialProperties<{
	select: Partial<
		Record<SimplePseudos, S & Omit<BaseSpecialProperties<S>, "$select">>
	>;
	parentSelect: Partial<
		Record<
			SimplePseudoClasses,
			S & Omit<BaseSpecialProperties<S>, "$parentSelect">
		>
	>;
	ancestorSelect: Partial<
		Record<
			SimplePseudoClasses,
			S & Omit<BaseSpecialProperties<S>, "$ancestorSelect">
		>
	>;
	dynamic: (vals: {
		mouse: {
			global: {
				pos: () => { x: number; y: number } | undefined;
				isDown: () => boolean;
			};
			local: {
				pos: () => { x: number; y: number } | undefined;
				isDown: () => boolean;
			};
		};
		scroll: {
			global: {
				pos: () => { x: number; y: number } | undefined;
			};
			local: {
				pos: () => { x: number; y: number } | undefined;
			};
		};
	}) => S;
}>;

export type SpecialProperties<
	S,
	BP extends Record<string, unknown> | undefined
> = BaseSpecialProperties<S> &
	(BP extends undefined
		? never
		: MapSpecialProperties<{
				[key in keyof BP]: S & Omit<BaseSpecialProperties<S>, "$dynamic">;
		  }>);

export type MapSpecialProperties<S extends Record<string, unknown>> = {
	[K in keyof S as `$${string & K}`]?: S[K];
};

export type SchemeName = keyof RivelInternalConfig["palettes"];
export type Palette = RivelInternalConfig["palettes"][SchemeName];
export type ThemeName = keyof RivelInternalConfig["themes"];
export type Theme = RivelInternalConfig["themes"][ThemeName];
export type Values = ReturnType<RivelInternalConfig["values"]>;
export type RVProperties = RivelInternalConfig["RVDirective"];
