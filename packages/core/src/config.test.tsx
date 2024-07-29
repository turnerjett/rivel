import { test, expect } from "vitest";
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { type RVDirective, createConfig } from "./config";
import { defaultConfig } from "@rivel/config";

const { rv } = createConfig(defaultConfig);

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			rv: RVDirective<typeof rv>;
		}
	}
}

test("style element", () => {
	const { container } = render(() => <div use:rv={{ bg: "red" }} />);
	expect(container.firstChild).toHaveClass("_bg-red");
});

test("update element styles", () => {
	const [styles, setStyles] = createSignal({
		bg: "red",
	});

	const { container } = render(() => <div use:rv={styles()} />);

	expect(container.firstChild).toHaveClass("_bg-red");
	setStyles({ bg: "blue" });
	expect(container.firstChild).not.toHaveClass("_bg-red");
	expect(container.firstChild).toHaveClass("_bg-blue");
});

test("set breakpoints", () => {
	const { container } = render(() => (
		<div use:rv={{ bg: "red", $sm: { bg: "blue" }, $lg: { bg: "green" } }} />
	));
	expect(container.firstChild).toHaveClass(
		"_bg-red",
		"_sm-bg-blue",
		"_lg-bg-green"
	);
});

test("set selector", () => {
	const { container } = render(() => (
		<div use:rv={{ bg: "red", $select: { ":hover": { bg: "blue" } } }} />
	));
	expect(container.firstChild).toHaveClass("_bg-red", "_hover-bg-blue");
});

test("set selector inside breakpoint", () => {
	const { container } = render(() => (
		<div
			use:rv={{ bg: "red", $sm: { $select: { ":hover": { bg: "blue" } } } }}
		/>
	));
	expect(container.firstChild).toHaveClass("_bg-red", "_sm-hover-bg-blue");
});
