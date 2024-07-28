import type { Breakpoints, GenericConfig, SpecialProperties } from "./config";
import type { Styles } from "./types";

type StylesWithSpecialProperties = Styles &
	SpecialProperties<Styles, Breakpoints>;

const styleCache = new Map<string, number>();
const breakpointCache = new Set<string>();

export const generateAtomicClassNames = <C extends GenericConfig>(
	styles: StylesWithSpecialProperties,
	config: C,
	special?: {
		breakpoint?: string;
		selector?: string;
	}
) => {
	const atomicClassNames: string[] = Object.entries(styles).flatMap(
		([key, value]) => {
			if (key.startsWith("$")) {
				const specialProperty = key.replace("$", "");
				if (config.breakpoints && specialProperty in config.breakpoints) {
					if (special?.breakpoint)
						throw new Error("Nested breakpoints are not supported");
					return generateAtomicClassNames(value, config, {
						breakpoint: specialProperty,
					});
				}
				if (specialProperty === "select") {
					if (special?.selector)
						throw new Error("Nested selectors are not supported");
					return Object.entries(value).flatMap(([selector, styles]) => {
						return generateAtomicClassNames(
							styles as StylesWithSpecialProperties,
							config,
							{
								selector: selector,
							}
						);
					});
				}
			}
			// Base styles
			const hashedSpecial = special?.breakpoint
				? hashString(special.breakpoint, 2)
				: special?.selector
				? hashString(special.selector, 2)
				: null;
			const hashedKey = hashString(key, 4);
			const hashedValue = hashString(value.toString(), 4);
			const className = hashedSpecial
				? `_${hashedSpecial}-${hashedKey}-${hashedValue}`
				: `_${hashedKey}-${hashedValue}`;
			updateStyleSheet(
				className,
				key,
				value.toString(),
				config.shorthands,
				config,
				special
			);
			return className;
		}
	);
	return atomicClassNames;
};

export const generateStyleSheets = (config: GenericConfig) => {
	const styleElement = document.createElement("style");
	styleElement.setAttribute("data-rivel", "");
	document.head.appendChild(styleElement);
	if (!config.breakpoints) return;
	const breakpointsStyleElement = document.createElement("style");

	breakpointsStyleElement.setAttribute("data-rivel-breakpoints", "");
	document.head.appendChild(breakpointsStyleElement);
	const breakpoints = Object.keys(config.breakpoints);
	for (const breakpoint of breakpoints) {
		breakpointsStyleElement.sheet?.insertRule(
			`@media (max-width: ${config.breakpoints?.[breakpoint]}px) {}`
		);
	}
};

const updateStyleSheet = (
	className: string,
	styleKey: string,
	styleValue: string,
	shorthands: Record<string, unknown> | undefined,
	config: GenericConfig,
	special?: {
		breakpoint?: string;
		selector?: string;
	}
) => {
	const realKey = handleShorthands(styleKey, shorthands);

	if (styleCache.has(className)) return;

	const styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;

	const styleIndex = () => styleElement.sheet?.cssRules.length ?? 0;
	styleCache.set(className, styleIndex());

	if (special?.breakpoint) {
		const breakpointStyleElement = document.querySelector(
			"style[data-rivel-breakpoints]"
		) as HTMLStyleElement;
		// biome-ignore lint/style/noNonNullAssertion: this is not null due to the check above
		const breakpoints = Object.keys(config.breakpoints!).reverse();
		const index = breakpoints.indexOf(special.breakpoint);
		const rule = breakpointStyleElement.sheet?.cssRules[index] as CSSMediaRule;
		const ruleIndex = rule?.cssRules.length ?? 0;
		insertRule(rule, className, realKey, styleValue, ruleIndex, "html:root");
		return;
	}
	if (special?.selector) {
		insertRule(
			styleElement,
			`${className}${special.selector}`,
			realKey,
			styleValue,
			styleIndex()
		);
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
