import { test, expect, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { createConfig } from "./config";
import { defaultConfig } from "@rivel/config";
import { styleCache } from "./css";
import type { RVDirective } from "./types";

const { rv, config } = createConfig(defaultConfig);

declare module "solid-js" {
	namespace JSX {
		interface Directives {
			rv: RVDirective<typeof rv>;
		}
	}
}

beforeEach(() => {
	styleCache.clear();
	const styleSheet = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;
	while ((styleSheet.sheet?.cssRules.length || 0) > 0) {
		styleSheet.sheet?.deleteRule(0);
	}
});

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

test("delete styles from style sheet", () => {
	const [styles, setStyles] = createSignal({
		bg: "red",
	});

	const { container } = render(() => <div use:rv={styles()} />);
	expect(container.firstChild).toHaveClass("_bg-red");

	const styleSheet = document.querySelector(
		"style[data-rivel]"
	) as HTMLStyleElement;
	const styleSheetBreakpoints = document.querySelector(
		"style[data-rivel-breakpoints]"
	) as HTMLStyleElement;
	const smIndex = Object.keys(config.breakpoints || {})
		.reverse()
		.indexOf("sm");
	const smRule = styleSheetBreakpoints?.sheet?.cssRules[
		smIndex
	] as CSSMediaRule;
	expect(styleSheet?.sheet?.cssRules.length).toBe(1);
	expect(styleCache.size).toBe(1);
	expect(styleCache.has("_bg-red")).toBe(true);

	setStyles({ bg: "blue" });
	expect(styleCache.size).toBe(1);
	expect(styleCache.has("_bg-red")).toBe(false);
	expect(styleCache.has("_bg-blue")).toBe(true);
	expect(styleSheet?.sheet?.cssRules.length).toBe(1);

	setStyles({ bg: "green", $sm: { dis: "block" } });
	expect(styleCache.size).toBe(2);
	expect(styleCache.has("_bg-blue")).toBe(false);
	expect(styleCache.has("_bg-green")).toBe(true);
	expect(styleCache.has("_sm-dis-block")).toBe(true);
	expect(styleSheet?.sheet?.cssRules.length).toBe(1);
	expect(smRule.cssRules.length).toBe(1);

	setStyles({ bg: "green", $sm: { bg: "red", dis: "block" } });
	expect(styleCache.size).toBe(3);
	expect(styleCache.has("_bg-green")).toBe(true);
	expect(styleCache.has("_sm-dis-block")).toBe(true);
	expect(styleCache.has("_sm-bg-red")).toBe(true);
	expect(styleSheet?.sheet?.cssRules.length).toBe(1);
	expect(smRule.cssRules.length).toBe(2);

	setStyles({ bg: "blue" });
	expect(styleCache.size).toBe(1);
	expect(styleCache.has("_bg-blue")).toBe(true);
	expect(styleCache.has("_sm-dis-block")).toBe(false);
	expect(styleCache.has("_sm-bg-green")).toBe(false);
	expect(styleSheet?.sheet?.cssRules.length).toBe(1);
	expect(smRule.cssRules.length).toBe(0);
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
	expect(container.firstChild).toHaveClass("_bg-red", "_self-hover-bg-blue");
});

test("set selector inside breakpoint", () => {
	const { container } = render(() => (
		<div
			use:rv={{ bg: "red", $sm: { $select: { ":hover": { bg: "blue" } } } }}
		/>
	));
	expect(container.firstChild).toHaveClass("_bg-red", "_sm-self-hover-bg-blue");
});
