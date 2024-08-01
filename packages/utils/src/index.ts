type LightDark =
	| `light${string}`
	| `dark${string}`
	| `${string}Light`
	| `${string}Dark`
	| `${string}Light${string}`
	| `${string}Dark${string}`;

export const isLight = (scheme: LightDark) =>
	scheme.includes("light") || scheme.includes("Light");
export const isDark = (scheme: LightDark) =>
	scheme.includes("dark") || scheme.includes("Dark");

export const invert = <T extends LightDark>(scheme: T): T => {
	if (scheme.includes("light")) {
		return scheme.replace("light", "dark") as T;
	}
	if (scheme.includes("Light")) {
		return scheme.replace("Light", "Dark") as T;
	}
	if (scheme.includes("dark")) {
		return scheme.replace("dark", "light") as T;
	}
	if (scheme.includes("Dark")) {
		return scheme.replace("Dark", "Light") as T;
	}
	throw new Error(`Invalid scheme argument to invert: ${scheme}`);
};

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("isLight light", () => {
		expect(isLight("light")).toBe(true);
		expect(isLight("lightLight")).toBe(true);
		expect(isLight("dark")).toBe(false);
		expect(isLight("darkDark")).toBe(false);
	});

	test("isDark dark", () => {
		expect(isDark("dark")).toBe(true);
		expect(isDark("darkDark")).toBe(true);
		expect(isDark("light")).toBe(false);
		expect(isDark("lightLight")).toBe(false);
	});

	test("invert light", () => {
		const result = invert("light");
		expect(result).toEqual("dark");
	});

	test("invert lightAlt", () => {
		const result = invert("lightAlt");
		expect(result).toEqual("darkAlt");
	});

	test("invert altLight", () => {
		const result = invert("altLight");
		expect(result).toEqual("altDark");
	});

	test("invert dark", () => {
		const result = invert("dark");
		expect(result).toEqual("light");
	});

	test("invert darkAlt", () => {
		const result = invert("darkAlt");
		expect(result).toEqual("lightAlt");
	});

	test("invert altDark", () => {
		const result = invert("altDark");
		expect(result).toEqual("altLight");
	});
}
