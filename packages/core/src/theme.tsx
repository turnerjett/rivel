import { type JSX, useContext, type Context, type Accessor } from "solid-js";
import type { GenericConfig } from "./config";

export const themeProviderFromContext =
	<C extends GenericConfig>(
		context: Context<{
			scheme: Accessor<keyof C["palettes"]>;
			theme: Accessor<keyof C["themes"]>;
			elevation: Accessor<number>;
		}>
	) =>
	(props: {
		name?:
			| keyof C["themes"]
			| ((theme: keyof C["themes"]) => keyof C["themes"]);
		scheme?:
			| keyof C["palettes"]
			| ((scheme: keyof C["palettes"]) => keyof C["palettes"]);
		elevation?: number | ((surface: number) => number);
		children: JSX.Element;
	}) => {
		const parentContext = useContext(context);
		return (
			<context.Provider
				value={{
					scheme: () =>
						typeof props.scheme === "function"
							? props.scheme(parentContext?.scheme())
							: props.scheme || parentContext?.scheme(),
					theme: () =>
						typeof props.name === "function"
							? props.name(parentContext?.theme())
							: props.name || parentContext?.theme(),
					elevation: () =>
						typeof props.elevation === "function"
							? props.elevation(parentContext?.elevation() || 0)
							: props.elevation || parentContext?.elevation(),
				}}
			>
				{props.children}
			</context.Provider>
		);
	};
