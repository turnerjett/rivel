import { type Accessor, createRenderEffect, onCleanup } from "solid-js";
import type { Breakpoints, GenericConfig } from "./config";
import type { SpecialProperties, Styles } from "./types";
import { generateAtomicClassNames, removeClasses } from "./css";
import { updateStyles } from "./rv-dynamic";

export const rvStylesWithConfig = <
	S extends Styles,
	BP extends Breakpoints | undefined
>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: GenericConfig
) => {
	updateClasses(el, styles, config);
	updateStyles(el, styles, config);
};

const updateClasses = <S extends Styles, BP extends Breakpoints | undefined>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: GenericConfig
) => {
	let prevClassNames: string[] = [];
	createRenderEffect(() => {
		const classNames = generateAtomicClassNames(
			styles(),
			prevClassNames,
			config
		);
		if (prevClassNames.length > 0) {
			const removed = prevClassNames.filter(
				(className) => !classNames.includes(className)
			);
			removeClasses(removed);
			el.classList.remove(...removed);
		}
		el.classList.add(...classNames);
		prevClassNames = classNames;
	});
};
