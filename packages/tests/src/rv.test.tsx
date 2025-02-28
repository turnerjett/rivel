import { test, expect, beforeEach, vi } from "vitest";
import { render as baseRender } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { rv, RivelProvider, type RVProperties } from "@rivel/core";
import { config } from "./test-config";
import { styleCache } from "@core/css";

const render: typeof baseRender = (ui, options) => {
	return baseRender(
		() => <RivelProvider config={config}>{ui()}</RivelProvider>,
		options
	);
};

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

test("nested breakpoint error", () => {
	expect(() =>
		render(() => (
			<div
				use:rv={{
					bg: "red",
					// @ts-expect-error
					$sm: { $md: { bg: "blue" } },
				}}
			/>
		))
	).toThrow("Nested breakpoints are not supported");
});

test("size related properties", () => {
	const { container } = render(() => (
		<div use:rv={{ bg: "red", w: 10, h: 10 }} />
	));
	expect(container.firstChild).toHaveStyle("width: 10rem");
	expect(container.firstChild).toHaveStyle("height: 10rem");
});

test("time related properties", () => {
	const { container } = render(() => (
		<div use:rv={{ bg: "red", animation: 100 }} />
	));
	expect(container.firstChild).toHaveStyle("animation: 100ms");
});

test("add dynamic styles", async () => {
	const { container } = render(() => (
		<div
			use:rv={{
				$dynamic: () => ({ backgroundColor: "red" }),
			}}
		/>
	));
	expect(container.firstChild).toHaveStyle("background-color: rgb(255, 0, 0)");
});

test("update dynamic styles", async () => {
	const [styles, setStyles] = createSignal({
		$dynamic: () => ({ backgroundColor: "red" }),
	});
	const { container } = render(() => <div use:rv={styles()} />);
	expect(container.firstChild).toHaveStyle("background-color: rgb(255, 0, 0)");
	setStyles({
		$dynamic: () => ({ backgroundColor: "blue" }),
	});
	expect(container.firstChild).toHaveStyle("background-color: rgb(0, 0, 255)");
});

test("update unrelated dynamic styles", async () => {
	const [styles, setStyles] = createSignal({
		$dynamic: () => ({ backgroundColor: "red" }),
	});
	const { container } = render(() => <div use:rv={styles()} />);
	expect(container.firstChild).toHaveStyle("background-color: rgb(255, 0, 0)");
	setStyles({
		// @ts-expect-error
		$dynamic: () => ({ display: "none" }),
	});
	expect(container.firstChild).toHaveStyle("display: none");
	expect(container.firstChild).not.toHaveStyle(
		"background-color: rgb(255, 0, 0)"
	);
});

test("multiple dynamic components", () => {
	const addEventListenerSpy = vi.spyOn(document, "addEventListener");

	render(() => (
		<>
			<div
				use:rv={{
					$dynamic: ({ mouse }) => ({
						"--pos-x": mouse.local.pos?.x,
						"--pos-y": mouse.local.pos?.y,
					}),
				}}
			/>
			<div
				use:rv={{
					$dynamic: ({ mouse }) => ({
						"--pos-x": mouse.local.pos?.x,
						"--pos-y": mouse.local.pos?.y,
					}),
				}}
			/>
		</>
	));

	expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
});

test("remove event listeners", () => {
	const addEventListenerSpy = vi.spyOn(document, "addEventListener");
	const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

	const { unmount } = render(() => (
		<div
			use:rv={{
				$dynamic: ({ mouse }) => ({
					bg: mouse.global.isDown ? "red" : "blue",
				}),
			}}
		/>
	));
	expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
	expect(removeEventListenerSpy).toHaveBeenCalledTimes(0);
	unmount();
	expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
	expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
});

test("trigger dynamic", async () => {
	const user = userEvent.setup();
	const { container } = render(() => (
		<div
			use:rv={{
				$dynamic: ({ mouse }) => ({
					bg: mouse.global.isDown ? "red" : "blue",
				}),
			}}
		/>
	));
	expect(container.firstChild).toHaveStyle("background-color: rgb(0, 0, 255)");
	await user.pointer({
		target: container.firstChild as Element,
		keys: "[MouseLeft>]",
	});
	expect(container.firstChild).toHaveStyle("background-color: rgb(255, 0, 0)");
	await user.pointer({
		target: container.firstChild as Element,
		keys: "[/MouseLeft]",
	});
	expect(container.firstChild).toHaveStyle("background-color: rgb(0, 0, 255)");
});

test("raw css", () => {
	const [styles, setStyles] = createSignal<RVProperties>({
		$raw: "& { background-color: red; }",
	});

	render(() => <div use:rv={styles()} />);
	expect(styleCache.size).toBe(1);

	setStyles({
		$raw: [
			"& { background-color: red; }",
			"& { flex-direction: column; }",
			"& { flex: 1; }",
		],
	});
	console.log(styleCache.values());
	expect(styleCache.size).toBe(3);

	setStyles({
		$raw: "& { background-color: blue; }",
	});
	console.log(styleCache.values());
	expect(styleCache.size).toBe(1);

	setStyles({ $raw: [] });
	expect(styleCache.size).toBe(0);
});

test("raw css error", () => {
	expect(() =>
		render(() => (
			<div
				use:rv={{
					$raw: "& { background-color: red; }; &:hover { background-color: blue; }",
				}}
			/>
		))
	).toThrow(
		"Raw value strings should only contain a single rule. Use an array of strings instead."
	);
});
