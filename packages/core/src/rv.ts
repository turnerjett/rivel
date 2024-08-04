import { type Accessor, createRenderEffect } from "solid-js";
import type { ConfigBreakpoints, GenericConfig } from "./config";
import type { SpecialProperties, Styles } from "./types";
import { generateAtomicClassNames, removeClasses } from "./css";
import { updateStyles } from "./dynamic";
import { useRivel } from "./root-provider";

export const rv = <S extends Styles, BP extends ConfigBreakpoints | undefined>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>
) => {
	const root = useRivel();
	createRenderEffect(() => {
		if (!root) return;
		updateClasses(el, styles, root.config());
		updateStyles(el, styles, root.config());
	});
};

const updateClasses = <
	S extends Styles,
	BP extends ConfigBreakpoints | undefined
>(
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
