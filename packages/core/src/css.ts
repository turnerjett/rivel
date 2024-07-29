import type { Breakpoints, GenericConfig, SpecialProperties } from "./config";
import type { StyleKeys, Styles } from "./types";
import { toKebabCase } from "./utils";

type StylesWithSpecialProperties = Styles &
	SpecialProperties<Styles, Breakpoints>;

const styleCache = new Map<string, number>();

export const generateAtomicClassNames = (
	styles: StylesWithSpecialProperties,
	config: GenericConfig,
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
						...special,
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
								...special,
								selector: selector,
							}
						);
					});
				}
			}

			const className = buildClassName(key, value, special);

			updateStyleSheet(className, key, value, config, special);
			return className;
		}
	);
	return atomicClassNames;
};

const buildClassName = (
	key: string,
	value: string | number,
	special?: {
		breakpoint?: string;
		selector?: string;
	}
) => {
	const hashedBreakpoint = special?.breakpoint
		? hashString(special.breakpoint, 2)
		: null;
	const hashedSelector = special?.selector
		? hashString(special.selector, 2)
		: null;
	const hashedKey = hashString(key, 4);
	const hashedValue = hashString(value.toString(), 4);

	if (hashedBreakpoint && hashedSelector) {
		return `_${hashedBreakpoint}-${hashedSelector}-${hashedKey}-${hashedValue}`;
	}
	if (hashedBreakpoint) {
		return `_${hashedBreakpoint}-${hashedKey}-${hashedValue}`;
	}
	if (hashedSelector) {
		return `_${hashedSelector}-${hashedKey}-${hashedValue}`;
	}
	return `_${hashedKey}-${hashedValue}`;
};

const updateStyleSheet = (
	className: string,
	styleKey: string,
	styleValue: string | number,
	config: GenericConfig,
	special?: {
		breakpoint?: string;
		selector?: string;
	}
) => {
	const realKey = handleShorthands(styleKey, config.shorthands);

	if (styleCache.has(className)) return;

	const styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;

	const styleIndex = () => styleElement.sheet?.cssRules.length ?? 0;

	if (special?.breakpoint) {
		const breakpointStyleElement = document.querySelector(
			"style[data-rivel-breakpoints]"
		) as HTMLStyleElement;
		// biome-ignore lint/style/noNonNullAssertion: this is not null due to the check above
		const breakpoints = Object.keys(config.breakpoints!).reverse();
		const index = breakpoints.indexOf(special.breakpoint);
		const rule = breakpointStyleElement.sheet?.cssRules[index] as CSSMediaRule;
		const ruleIndex = rule?.cssRules.length ?? 0;
		if (special.selector) {
			insertRule(
				rule,
				`${className}${special.selector}`,
				realKey,
				styleValue,
				ruleIndex,
				config
			);
		} else {
			insertRule(rule, className, realKey, styleValue, ruleIndex, config);
		}
		styleCache.set(className, ruleIndex);
		return;
	}
	if (special?.selector) {
		insertRule(
			styleElement,
			`${className}${special.selector}`,
			realKey,
			styleValue,
			styleIndex(),
			config
		);
		styleCache.set(className, styleIndex());
		return;
	}
	insertRule(
		styleElement,
		className,
		realKey,
		styleValue,
		styleIndex(),
		config
	);
	styleCache.set(className, styleIndex());
};

const insertRule = (
	element: HTMLStyleElement | CSSMediaRule,
	className: string,
	styleKey: string | string[],
	styleValue: string | number,
	index: number,
	config: GenericConfig
) => {
	const el = element instanceof HTMLStyleElement ? element.sheet : element;
	const value =
		typeof styleValue === "number"
			? timeRelatedProperties.has(styleKey as StyleKeys)
				? `${styleValue}${config.options?.cssTimeUnit}`
				: `${styleValue}${config.options?.cssSizeUnit}`
			: styleValue;
	if (!el)
		throw new Error("Element is not a valid HTMLStyleElement or CSSMediaRule");
	if (typeof styleKey === "string") {
		el.insertRule(
			`:root .${className} { ${toKebabCase(styleKey)}: ${value}; }`,
			index
		);
	} else {
		for (const key of styleKey) {
			el.insertRule(
				`:root .${className} { ${toKebabCase(key)}: ${value}; }`,
				index
			);
		}
	}
};

export const generateStyleSheets = (config: GenericConfig) => {
	const styleElement = document.createElement("style");
	styleElement.setAttribute("data-rivel", "");
	document.head.appendChild(styleElement);
	if (!config.breakpoints) return;
	const breakpointsStyleElement = document.createElement("style");

	if (!config.breakpoints) return;
	breakpointsStyleElement.setAttribute("data-rivel-breakpoints", "");
	document.head.appendChild(breakpointsStyleElement);
	const breakpoints = Object.keys(config.breakpoints);
	for (const breakpoint of breakpoints) {
		breakpointsStyleElement.sheet?.insertRule(
			`@media (max-width: ${config.breakpoints?.[breakpoint]}px) {}`
		);
	}
};

const timeRelatedProperties = new Set<StyleKeys>([
	"animationDelay",
	"animationDuration",
	"transitionDelay",
	"transitionDuration",
	"animation",
	"transition",
	"animationTimingFunction",
	"transitionTimingFunction",
]);

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
