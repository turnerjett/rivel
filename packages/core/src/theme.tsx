import { type JSX, useContext, type Accessor, createContext } from "solid-js";
import type { RivelInternalConfig } from "./config";
import { useRivel } from "./root-provider";

type Schemes = keyof RivelInternalConfig["palettes"];
type Themes = keyof RivelInternalConfig["themes"];
const ThemeContext = createContext<{
	scheme: Accessor<Schemes>;
	theme: Accessor<Themes>;
	elevation: Accessor<number>;
}>();
export const useTheme = () => useContext(ThemeContext);

export const Theme = (props: {
	name?:
		| keyof RivelInternalConfig["themes"]
		| ((
				theme: keyof RivelInternalConfig["themes"]
		  ) => keyof RivelInternalConfig["themes"]);
	scheme?:
		| keyof RivelInternalConfig["palettes"]
		| ((
				scheme: keyof RivelInternalConfig["palettes"]
		  ) => keyof RivelInternalConfig["palettes"]);
	elevation?: number | ((surface: number) => number);
	children: JSX.Element;
}) => {
	const parentContext = useTheme();
	const root = useRivel();
	if (!root) {
		throw new Error(
			"Theme must be used within a RivelProvider. Make sure you have wrapped your app in a RivelProvider."
		);
	}
	const schemeFallback = () => parentContext?.scheme() || root.default.scheme();
	const themeFallback = () => parentContext?.theme() || root.default.theme();
	if (!schemeFallback() || !themeFallback()) {
		throw new Error(
			"Theme must specify at least one scheme and theme. Make sure you have wrapped your app in a RivelProvider."
		);
	}
	const elevationFallback = parentContext?.elevation() || 0;
	return (
		<ThemeContext.Provider
			value={{
				scheme: () =>
					typeof props.scheme === "function"
						? props.scheme(schemeFallback())
						: props.scheme || schemeFallback(),
				theme: () =>
					typeof props.name === "function"
						? props.name(themeFallback())
						: props.name || themeFallback(),
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
