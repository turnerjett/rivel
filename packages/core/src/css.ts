import type { Breakpoints, GenericConfig, SpecialProperties } from "./config";
import type { StyleKeys, Styles } from "./types";
import { toKebabCase } from "./utils";

type StylesWithSpecialProperties = Styles &
	SpecialProperties<Styles, Breakpoints>;

export const styleCache = new Map<
	string,
	{
		rule: CSSRule;
		references: number;
		breakpoint?: string;
	}
>();

export const generateAtomicClassNames = (
	styles: StylesWithSpecialProperties,
	exclude: string[],
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
					return generateAtomicClassNames(value, exclude, config, {
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
							exclude,
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
			if (exclude.includes(className)) return className;

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

	if (styleCache.has(className)) {
		const cached = styleCache.get(className);
		if (cached) {
			cached.references++;
		}
		return;
	}

	const styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;

	if (special?.breakpoint) {
		const breakpointStyleElement = document.querySelector(
			"style[data-rivel-breakpoints]"
		) as HTMLStyleElement;
		// biome-ignore lint/style/noNonNullAssertion: this is not null due to the check above
		const breakpoints = Object.keys(config.breakpoints!).reverse();
		const index = breakpoints.indexOf(special.breakpoint);
		const rule = breakpointStyleElement.sheet?.cssRules[index] as CSSMediaRule;
		let ruleToInsert: CSSRule;
		if (special.selector) {
			ruleToInsert = insertRule(
				rule,
				`${className}${special.selector}`,
				realKey,
				styleValue,
				config
			);
		} else {
			ruleToInsert = insertRule(rule, className, realKey, styleValue, config);
		}
		styleCache.set(className, {
			rule: ruleToInsert,
			references: 1,
			breakpoint: special.breakpoint,
		});
		return;
	}
	if (special?.selector) {
		const ruleToInsert = insertRule(
			styleElement,
			`${className}${special.selector}`,
			realKey,
			styleValue,
			config
		);
		styleCache.set(className, {
			rule: ruleToInsert,
			references: 1,
		});
		return;
	}
	const ruleToInsert = insertRule(
		styleElement,
		className,
		realKey,
		styleValue,
		config
	);
	styleCache.set(className, {
		rule: ruleToInsert,
		references: 1,
	});
};

const insertRule = (
	element: HTMLStyleElement | CSSMediaRule,
	className: string,
	styleKey: string | string[],
	styleValue: string | number,
	config: GenericConfig
): CSSRule => {
	const el = element instanceof HTMLStyleElement ? element.sheet : element;
	const value =
		typeof styleValue === "number"
			? timeRelatedProperties.has(styleKey as StyleKeys)
				? `${styleValue}${config.options?.cssTimeUnit}`
				: `${styleValue}${config.options?.cssSizeUnit}`
			: styleValue;
	if (!el)
		throw new Error("Element is not a valid HTMLStyleElement or CSSMediaRule");
	let ruleString: string;
	if (typeof styleKey === "string")
		ruleString = `${toKebabCase(styleKey)}: ${value};`;
	else
		ruleString = styleKey
			.map((key) => `${toKebabCase(key)}: ${value};`)
			.join(" ");
	el.insertRule(`:root .${className} { ${ruleString} }`);
	// biome-ignore lint/style/noNonNullAssertion: this is not null due to the insertRule above
	return el.cssRules[0]!;
};

export const removeClasses = (classes: string[]) => {
	const styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;

	for (const className of classes) {
		const cached = styleCache.get(className);
		if (!cached)
			throw new Error(
				`Class ${className} should not exist without being present in the cache`
			);
		cached.references--;
		if (cached.references !== 0) continue;
		if (cached.breakpoint) {
			const breakpointRule = cached.rule.parentRule as CSSMediaRule;
			if (!breakpointRule) throw new Error(`Rule for ${className} not found`);
			const ruleIndex = Array.from(breakpointRule.cssRules).indexOf(
				cached.rule as CSSRule
			);
			breakpointRule.deleteRule(ruleIndex);
			styleCache.delete(className);
			continue;
		}
		const ruleIndex = Array.from(styleElement.sheet?.cssRules || []).indexOf(
			cached.rule as CSSRule
		);
		styleElement.sheet?.deleteRule(ruleIndex);
		styleCache.delete(className);
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
