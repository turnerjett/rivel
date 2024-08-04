import {
	type Accessor,
	type Component,
	type JSXElement,
	createContext,
	useContext,
} from "solid-js";
import type { RivelInternalConfig } from "./config";

interface RivelContext {
	config: Accessor<RivelInternalConfig>;
	default: {
		theme: Accessor<keyof RivelInternalConfig["themes"]>;
		scheme: Accessor<keyof RivelInternalConfig["palettes"]>;
	};
}

const RivelContext = createContext<RivelContext>();
export const useRivel = () => useContext(RivelContext);

export const RivelProvider: Component<{
	config: RivelInternalConfig;
	children: JSXElement;
}> = (props) => {
	const defaultTheme = () =>
		Object.keys(props.config.themes)[0] as keyof RivelInternalConfig["themes"];
	if (!defaultTheme) {
		throw new Error("Config must specify at least one theme");
	}
	const defaultScheme = () =>
		Object.keys(
			props.config.palettes
		)[0] as keyof RivelInternalConfig["palettes"];
	if (!defaultScheme() || !props.config.palettes[defaultScheme()]) {
		throw new Error("Config must specify at least one scheme and palette");
	}
	return (
		<RivelContext.Provider
			value={{
				config: () => props.config,
				default: {
					theme: defaultTheme,
					scheme: defaultScheme,
				},
			}}
		>
			{props.children}
		</RivelContext.Provider>
	);
};
