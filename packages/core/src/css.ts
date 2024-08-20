import { timeRelatedProperties, withoutUnitProperties } from "./constants";
import type { GenericConfig, RivelInternalConfig } from "./config";
import type { StyleKeys, RVProperties } from "./types";
import { toKebabCase } from "./utils";

interface SpecialArgs {
	breakpoint?: string;
	selector?: {
		self?: string;
		parent?: string;
		ancestor?: string;
	};
}

export const styleCache = new Map<
	string,
	{
		rule: CSSRule;
		references: number;
		breakpoint?: string;
	}
>();

export const generateAtomicClassNames = (
	styles: RVProperties,
	exclude: string[],
	config: GenericConfig,
	special?: SpecialArgs
) => {
	if (!styles) throw new Error("Styles must be defined");
	const atomicClassNames: string[] = Object.entries(styles)
		// Reversed to respect the specificity of the styles
		// Rules are inserted at index 0
		.reverse()
		.flatMap(([key, value]) => {
			if (key.startsWith("$")) {
				return handleSpecialProperty(key, value, exclude, config, special);
			}

			const className = buildClassName(key, value, special);
			if (exclude.includes(className)) return className;

			updateStyleSheet(className, key, value, config, special);
			return className;
		});
	return atomicClassNames;
};

const handleSpecialProperty = (
	key: string,
	value: unknown,
	exclude: string[],
	config: GenericConfig,
	special?: SpecialArgs
): string[] => {
	const specialProperty = key.replace("$", "");
	// Dynamic uses direct styles rather than atomic CSS classes
	if (specialProperty === "dynamic") return [];

	if (config.breakpoints && specialProperty in config.breakpoints) {
		if (special?.breakpoint)
			throw new Error("Nested breakpoints are not supported");
		return generateAtomicClassNames(value as RVProperties, exclude, config, {
			...special,
			breakpoint: specialProperty,
		});
	}

	if (specialProperty.toLowerCase().endsWith("select")) {
		let selectorType = specialProperty.toLowerCase().replace("select", "");
		selectorType = selectorType ? selectorType : "self";

		const prevSelector =
			special?.selector?.[selectorType as keyof typeof special.selector];

		return Object.entries(value as Record<string, unknown>)
			.reverse()
			.flatMap(([selector, styles]) => {
				const selectorObj = {
					...special?.selector,
					[selectorType]: prevSelector
						? `${prevSelector}${selector}`
						: selector,
				};
				return generateAtomicClassNames(
					styles as RVProperties,
					exclude,
					config,
					{
						...special,
						selector: selectorObj,
					}
				);
			});
	}

	if (specialProperty === "raw") {
		return handleRaw(value as string | string[], exclude);
	}

	throw new Error(`Invalid special property: ${key}`);
};

const handleRaw = (value: string | string[], exclude: string[]) => {
	const val = typeof value === "string" ? [value] : value;
	const classes = val.map((v) => `_${hashString(v, 8, true)}`);
	const replaced = classes.map((cls, index) => {
		if (exclude.includes(cls)) return;
		if (styleCache.has(cls)) {
			const cached = styleCache.get(cls);
			if (!cached) throw new Error("Invalid class name");
			if (exclude.includes(cls)) return;
			cached.references++;
			return;
		}

		const v = val[index];
		if (!v) throw new Error("Invalid raw value");
		const split = v.split("{");
		if (split.length > 2)
			throw new Error(
				"Raw value strings should only contain a single rule. Use an array of strings instead."
			);
		const selector = split[0];
		if (!selector) throw new Error("Invalid raw value");
		const newSelector = selector.replace(/&/g, `.${cls}`);
		return `${newSelector} { ${split[1]}`;
	});

	const styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;

	for (const [index, value] of replaced.entries()) {
		if (!value) continue;
		styleElement.sheet?.insertRule(value);
		if (!classes[index]) throw new Error("Invalid class name");
		styleCache.set(classes[index], {
			rule: styleElement.sheet?.cssRules[0] as CSSRule,
			references: 1,
		});
	}

	return classes;
};

const buildClassName = (
	key: string,
	value: string | number,
	special?: SpecialArgs
) => {
	const hashedBreakpoint = special?.breakpoint
		? hashString(special.breakpoint, 2)
		: null;
	const hashedSelector = Object.entries(special?.selector || {})
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([selector, value]) => hashString(`${selector}-${value}`, 2))
		.join("-");
	const hashedKey = hashString(key, 4);
	const hashedValue = hashString(value.toString(), 4);

	return `_${[hashedBreakpoint, hashedSelector, hashedKey, hashedValue]
		.filter(Boolean)
		.join("-")}`;
};

const updateStyleSheet = (
	className: string,
	styleKey: string,
	styleValue: string | number,
	config: GenericConfig,
	special?: SpecialArgs
) => {
	if (styleCache.has(className)) {
		const cached = styleCache.get(className);
		if (cached) {
			cached.references++;
		}
		return;
	}

	const realKey = handleShorthands(styleKey, config);

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
			ruleToInsert = insertSelector(
				rule,
				className,
				realKey,
				styleValue,
				special,
				config
			);
		} else {
			ruleToInsert = insertRule(
				rule,
				`.${className}`,
				realKey,
				styleValue,
				config
			);
		}
		styleCache.set(className, {
			rule: ruleToInsert,
			references: 1,
			breakpoint: special.breakpoint,
		});
		return;
	}
	if (special?.selector) {
		const ruleToInsert = insertSelector(
			styleElement,
			className,
			realKey,
			styleValue,
			special,
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
		`.${className}`,
		realKey,
		styleValue,
		config
	);
	styleCache.set(className, {
		rule: ruleToInsert,
		references: 1,
	});
};

const insertSelector = (
	element: HTMLStyleElement | CSSMediaRule,
	className: string,
	key: string | string[],
	value: string | number,
	special: SpecialArgs,
	config: GenericConfig
) => {
	if (!special.selector) throw new Error("Invalid selector object");
	let buildClass = `.${className}`;
	if (special.selector.self) {
		buildClass += special.selector.self;
	}
	if (special.selector.parent) {
		buildClass = `${special.selector.parent} > ${buildClass}`;
	}
	if (special.selector.ancestor) {
		buildClass = `${special.selector.ancestor} ${buildClass}`;
	}
	return insertRule(element, buildClass, key, value, config);
};

const insertRule = (
	element: HTMLStyleElement | CSSMediaRule,
	className: string,
	styleKey: string | string[],
	styleValue: string | number,
	config: GenericConfig
): CSSRule => {
	const el = element instanceof HTMLStyleElement ? element.sheet : element;
	const value = withCorrectUnit(styleValue, styleKey, config);
	if (!el)
		throw new Error("Element is not a valid HTMLStyleElement or CSSMediaRule");
	let ruleString: string;
	if (typeof styleKey === "string")
		ruleString = `${toKebabCase(styleKey)}: ${value};`;
	else
		ruleString = styleKey
			.map((key) => `${toKebabCase(key)}: ${value};`)
			.join(" ");
	el.insertRule(`:root ${className} { ${ruleString} }`);
	// biome-ignore lint/style/noNonNullAssertion: this is not null due to the insertRule above
	return el.cssRules[0]!;
};

const withCorrectUnit = (
	styleValue: string | number,
	styleKey: string | string[],
	config: GenericConfig
) => {
	if (typeof styleValue !== "number") return styleValue;
	const isTimeRelated =
		typeof styleKey === "string"
			? timeRelatedProperties.has(styleKey as StyleKeys)
			: styleKey.some((key) => timeRelatedProperties.has(key as StyleKeys));
	if (isTimeRelated) return `${styleValue}${config.options?.cssTimeUnit}`;
	const isWithoutUnit =
		typeof styleKey === "string"
			? withoutUnitProperties.has(styleKey as StyleKeys)
			: styleKey.some((key) => withoutUnitProperties.has(key as StyleKeys));
	if (isWithoutUnit) return styleValue.toString();
	return `${styleValue}${config.options?.cssSizeUnit}`;
};

export const removeClasses = (classes: string[]) => {
	const styleElement = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;

	if (!styleElement.sheet) throw new Error("Style element is not valid");

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

		const ruleIndex = Array.from(styleElement.sheet.cssRules).indexOf(
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

const handleShorthands = (styleKey: string, config: RivelInternalConfig) => {
	const { shorthands } = config;
	if (!shorthands || !(styleKey in (shorthands as Record<string, unknown>)))
		return styleKey;
	return shorthands[styleKey as keyof typeof shorthands] as string | string[];
};

const hashString = (
	str: string,
	length: number,
	minified?: boolean
): string => {
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
