import type { Breakpoints, GenericConfig, SpecialProperties } from "./config";
import type { Styles } from "./types";

const styleCache = new Map<string, number>();
const breakpointCache = new Set<string>();

export const generateAtomicClassNames = <C extends GenericConfig>(
	styles: Styles & SpecialProperties<Styles, Breakpoints>,
	config: C,
	breakpoint?: string
) => {
	const atomicClassNames: string[] = Object.entries(styles).flatMap(
		([key, value]) => {
			if (key.startsWith("$")) {
				const specialProperty = key.replace("$", "");
				if (config.breakpoints && specialProperty in config.breakpoints) {
					if (breakpoint)
						throw new Error("Nested breakpoints are not supported");
					return generateAtomicClassNames(value, config, specialProperty);
				}
			}
			// Base styles
			const hashedBreakpoint = breakpoint ? hashString(breakpoint, 2) : null;
			const hashedKey = hashString(key, 4);
			const hashedValue = hashString(value.toString(), 4);
			const className = breakpoint
				? `_${hashedBreakpoint}-${hashedKey}-${hashedValue}`
				: `_${hashedKey}-${hashedValue}`;
			updateStyleSheet(
				className,
				key,
				value.toString(),
				config.shorthands,
				config,
				breakpoint
			);
			return className;
		}
	);
	return atomicClassNames;
};

const updateStyleSheet = (
	className: string,
	styleKey: string,
	styleValue: string,
	shorthands: Record<string, unknown> | undefined,
	config: GenericConfig,
	breakpoint?: string
) => {
	const realKey = handleShorthands(styleKey, shorthands);

	if (styleCache.has(className)) return;

	let styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;
	if (!styleElement) {
		styleElement = document.createElement("style");
		styleElement.setAttribute("data-rivel", "");
		document.head.appendChild(styleElement);
	}

	const styleIndex = () => styleElement.sheet?.cssRules.length ?? 0;
	styleCache.set(className, styleIndex());

	if (breakpoint) {
		// biome-ignore lint/style/noNonNullAssertion: this is not null due to the check above
		const breakpoints = Object.keys(config.breakpoints!).reverse();
		const index = breakpoints.indexOf(breakpoint);
		if (!breakpointCache.has(breakpoint)) {
			breakpointCache.add(breakpoint);
			styleElement.sheet?.insertRule(
				`@media (max-width: ${config.breakpoints?.[breakpoint]}px) {}`,
				index
			);
		}
		const rule = styleElement.sheet?.cssRules[index] as CSSMediaRule;
		const ruleIndex = rule?.cssRules.length ?? 0;
		insertRule(rule, className, realKey, styleValue, ruleIndex, "html:root");
		return;
	}
	insertRule(styleElement, className, realKey, styleValue, styleIndex());
};

const insertRule = (
	element: HTMLStyleElement | CSSMediaRule,
	className: string,
	styleKey: string | string[],
	styleValue: string,
	index: number,
	specificity?: string
) => {
	const el = element instanceof HTMLStyleElement ? element.sheet : element;
	const specif = specificity || ":root";
	if (!el)
		throw new Error("Element is not a valid HTMLStyleElement or CSSMediaRule");
	if (typeof styleKey === "string") {
		el.insertRule(
			`${specif} .${className} { ${toKebabCase(styleKey)}: ${styleValue}; }`,
			index
		);
	} else {
		for (const key of styleKey) {
			el.insertRule(
				`${specif} .${className} { ${toKebabCase(key)}: ${styleValue}; }`,
				index
			);
		}
	}
};

const toKebabCase = (str: string) => {
	return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};

const handleShorthands = (
	styleKey: string,
	shorthands: Record<string, unknown> | undefined
) => {
	if (!shorthands || !(styleKey in (shorthands as Record<string, unknown>)))
		return styleKey;
	return shorthands[styleKey as keyof typeof shorthands] as string | string[];
};

const hashString = (str: string, length: number): string => {
	if (import.meta.env.NODE_ENV !== "production") {
		return debugHash(str);
	}
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	hash = hash ^ str.length;
	hash = hash ^ (str.charCodeAt(0) << 16) ^ str.charCodeAt(str.length - 1);
	return Math.abs(hash).toString(36).substring(0, length);
};

// Create a human-readable hash during development
const debugHash = (str: string): string => {
	const baseReplace = str.replace(/[ !#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "-");
	const replaceDoubleDash = baseReplace.replace(/-+/g, "-");
	const trimmed = replaceDoubleDash.replace(/^-|-$/g, "");
	return trimmed;
};
