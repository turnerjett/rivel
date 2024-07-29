import type * as CSS from "csstype";

export type CSSProperties = CSS.StandardProperties<
	string | number,
	string | number
>;
export type CSSPropertyKeys = keyof CSSProperties;

export type Styles = CSSProperties;
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
