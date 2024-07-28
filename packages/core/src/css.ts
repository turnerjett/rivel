import type { Styles } from "./types";

let styleIndex = 0;
const styleCache = new Map<string, number>();

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

const updateStyleSheet = (
	className: string,
	styleKey: string,
	styleValue: string,
	shorthands: Record<string, unknown> | undefined
) => {
	const realKey = handleShorthands(styleKey, shorthands);

	if (styleCache.has(className)) return;
	styleCache.set(className, styleIndex);

	let styleElement = document.querySelector(
		"style[data-ripply]"
	) as HTMLStyleElement;
	if (!styleElement) {
		styleElement = document.createElement("style");
		styleElement.setAttribute("data-ripply", "");
		document.head.appendChild(styleElement);
	}
	if (typeof realKey === "string") {
		styleElement.sheet?.insertRule(
			`:root .${className} { ${toKebabCase(realKey)}: ${styleValue}; }`,
			styleIndex
		);
		styleIndex++;
	} else {
		for (const key of realKey) {
			styleElement.sheet?.insertRule(
				`:root .${className} { ${toKebabCase(key)}: ${styleValue}; }`,
				styleIndex
			);
			styleIndex++;
		}
	}
};

export const generateAtomicClassNames = (
	styles: Styles,
	shorthands?: Record<string, unknown>
) => {
	const atomicClassNames = Object.entries(styles).map(([key, value]) => {
		const hashedKey = hashString(key, 4);
		const hashedValue = hashString(value.toString(), 4);
		const className = `_${hashedKey}-${hashedValue}`;
		updateStyleSheet(className, key, value.toString(), shorthands);
		return className;
	});
	return atomicClassNames;
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
