export const withElevation = (palette: string[], elevation: number) => {
	if (elevation === 0) return palette;
	if (elevation > 0)
		return palette.map((_, index) => {
			if (index >= palette.length - elevation) {
				return palette[Math.max(palette.length - 1, index)] as string;
			}
			return palette[index + elevation] as string;
		});
	return palette.map((_, index) => {
		if (index < -elevation) {
			return palette[Math.min(0, index)] as string;
		}
		return palette[index + elevation] as string;
	});
};

export const toKebabCase = (str: string) => {
	return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("positive elevation", () => {
		const palette = ["#000", "#001", "#002"];
		const result1 = withElevation(palette, 1);
		expect(result1).toEqual(["#001", "#002", "#002"]);
		const result2 = withElevation(palette, 2);
		expect(result2).toEqual(["#002", "#002", "#002"]);
	});

	test("negative elevation", () => {
		const palette = ["#000", "#001", "#002"];
		const result1 = withElevation(palette, -1);
		expect(result1).toEqual(["#000", "#000", "#001"]);
		const result2 = withElevation(palette, -2);
		expect(result2).toEqual(["#000", "#000", "#000"]);
	});

	test("camel case to kebab case", () => {
		const result1 = toKebabCase("animationDuration");
		expect(result1).toEqual("animation-duration");
		const result2 = toKebabCase("animation-duration");
		expect(result2).toEqual("animation-duration");
		const result3 = toKebabCase("animationTimingFunction");
		expect(result3).toEqual("animation-timing-function");
	});
}
