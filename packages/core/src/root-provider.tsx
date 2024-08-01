import {
	type Component,
	type JSXElement,
	createContext,
	useContext,
} from "solid-js";
import type { GenericConfig, RivelConfig } from "./config";

interface RivelContext {
	config: RivelConfig;
	default: {
		theme: keyof RivelConfig["themes"];
		scheme: keyof RivelConfig["palettes"];
	};
}

const RivelContext = createContext<RivelContext>();
export const useRivel = () =>
	useContext(RivelContext) as {
		config: RivelConfig;
		default: {
			theme: keyof RivelConfig["themes"];
			scheme: keyof RivelConfig["palettes"];
		};
	};

export const RivelProvider: Component<{
	config: RivelConfig;
	children: JSXElement;
}> = (props) => {
	const defaultTheme = Object.keys(
		props.config.themes
	)[0] as keyof RivelConfig["themes"];
	if (!defaultTheme) {
		throw new Error("Config must specify at least one theme");
	}
	const defaultScheme = Object.keys(
		props.config.palettes
	)[0] as keyof RivelConfig["palettes"];
	if (!defaultScheme || !props.config.palettes[defaultScheme]) {
		throw new Error("Config must specify at least one scheme and palette");
	}
	return (
		<RivelContext.Provider
			value={{
				config: props.config,
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
