import { type JSX, useContext, type Accessor, createContext } from "solid-js";
import type { RivelConfig } from "./config";
import { useRivel } from "./root-provider";

type Schemes = keyof RivelConfig["palettes"];
type Themes = keyof RivelConfig["themes"];
const ThemeContext = createContext<{
	scheme: Accessor<Schemes>;
	theme: Accessor<Themes>;
	elevation: Accessor<number>;
}>();
export const useTheme = () => useContext(ThemeContext);

export const Theme = (props: {
	name?:
		| keyof RivelConfig["themes"]
		| ((theme: keyof RivelConfig["themes"]) => keyof RivelConfig["themes"]);
	scheme?:
		| keyof RivelConfig["palettes"]
		| ((
				scheme: keyof RivelConfig["palettes"]
		  ) => keyof RivelConfig["palettes"]);
	elevation?: number | ((surface: number) => number);
	children: JSX.Element;
}) => {
	const parentContext = useTheme();
	const root = useRivel();
	const schemeFallback = parentContext?.scheme() || root.default.scheme;
	const themeFallback = parentContext?.theme() || root.default.theme;
	const elevationFallback = parentContext?.elevation() || 0;
	return (
		<ThemeContext.Provider
			value={{
				scheme: () =>
					typeof props.scheme === "function"
						? props.scheme(schemeFallback)
						: props.scheme || schemeFallback,
				theme: () =>
					typeof props.name === "function"
						? props.name(themeFallback)
						: props.name || themeFallback,
				elevation: () =>
					typeof props.elevation === "function"
						? props.elevation(elevationFallback)
						: props.elevation || elevationFallback,
			}}
		>
			{props.children}
		</ThemeContext.Provider>
	);
};
