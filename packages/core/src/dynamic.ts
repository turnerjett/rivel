import { type Accessor, createRenderEffect, onCleanup } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { Breakpoints, GenericConfig } from "./config";
import { timeRelatedProperties } from "./css";
import type { Styles, SpecialProperties, StyleKeys } from "./types";
import { toKebabCase } from "./utils";
import { createAccessors } from "./dynamic-accessors";

export const updateStyles = <
	S extends Styles,
	BP extends Breakpoints | undefined
>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: GenericConfig
) => {
	let previousStyleKeys: Set<StyleKeys> = new Set();

	const accessors = createAccessors(el);

	createRenderEffect(() => {
		const s = styles();
		if (typeof s.$dynamic === "function") {
			const dynamicStyles = s.$dynamic({
				...accessors,
			});
			const newKeys = updateElementStyles(
				el as HTMLElement,
				dynamicStyles,
				previousStyleKeys,
				config
			);
			previousStyleKeys = newKeys;
		}
	});
};

const updateElementStyles = (
	el: HTMLElement,
	styles: Styles,
	previousStyleKeys: Set<StyleKeys>,
	config: GenericConfig
) => {
	const style = el.style;
	const newKeys = new Set<StyleKeys>();
	for (const [key, value] of Object.entries(styles)) {
		if (previousStyleKeys.has(key as StyleKeys)) {
			previousStyleKeys.delete(key as StyleKeys);
		}
		if (typeof value === "number") {
			if (timeRelatedProperties.has(key as StyleKeys)) {
				setStyleProperty(
					el,
					key as StyleKeys,
					`${value}${config.options?.cssTimeUnit}`,
					newKeys,
					config
				);
			} else {
				setStyleProperty(el, key as StyleKeys, `${value}px`, newKeys, config);
			}
		} else {
			setStyleProperty(el, key as StyleKeys, value, newKeys, config);
		}
	}
	for (const key of previousStyleKeys) {
		if (newKeys.has(key)) continue;
		style.removeProperty(toKebabCase(key));
	}
	return newKeys;
};

const setStyleProperty = (
	el: HTMLElement,
	key: StyleKeys,
	value: string,
	newKeys: Set<StyleKeys>,
	config: GenericConfig
) => {
	const realKey = handleShorthandKey(key, config);
	if (typeof realKey === "string") {
		const kebabKey = toKebabCase(realKey);
		el.style.setProperty(kebabKey, value);
		newKeys.add(kebabKey as StyleKeys);
	} else {
		for (const k of realKey) {
			const kebabKey = toKebabCase(k);
			el.style.setProperty(kebabKey, value);
			newKeys.add(kebabKey as StyleKeys);
		}
	}
};

const handleShorthandKey = (key: StyleKeys, config: GenericConfig) => {
	if (!config.shorthands || !config.shorthands[key]) return key;
	return config.shorthands[key];
};
