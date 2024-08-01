import { rv } from "../../rivel.config";
import type { Component, ComponentProps, JSXElement } from "solid-js";

export const Button: Component<ComponentProps<"button">> = (props) => {
	const borderWidth = 1;
	return (
		<rv.Theme elevation={(surface) => surface + 2}>
			<button
				type="button"
				use:rv={{
					bg: rv.colors().border.default,
					col: rv.colors().textPrimary,
					bw: 0,
					rd: 0.25,
					px: 0.75,
					py: 0.25,
					pos: "relative",
					ov: "hidden",
					transition:
						"box-shadow 0.1s ease-in-out, opacity 0.1s ease-in-out, background-color 0.1s ease-in-out",
					$select: {
						":hover": {
							bg: rv.colors().border.hover,
							boxShadow: `0 3px 8px -2px ${rv.colors().background.hover}`,
						},
						":active": {
							bg: rv.colors().border.active,
							boxShadow: `0 2px 4px -2px ${rv.colors().background.active}`,
						},
						"::before": {
							content: "''",
							pos: "absolute",
							t: 0,
							l: 0,
							w: "200%",
							aspectRatio: "1",
							background: `radial-gradient(circle, ${
								rv.colors().solid.default
							} 0%, transparent 50%)`,
							translate:
								"calc(-50% + var(--mouse-x)) calc(-50% + var(--mouse-y))",
							rd: "100%",
						},
						"::after": {
							content: "''",
							pos: "absolute",
							inset: `${borderWidth}px`,
							rd: `calc(0.25rem - ${borderWidth}px)`,
							bg: rv.colors().background.default,
							transition: "background-color 0.2s ease-in-out",
						},
						":hover::after": {
							bg: rv.colors().background.hover,
						},
						":active::after": {
							bg: rv.colors().background.active,
						},
						":active::before": {
							op: 0,
						},
					},
					$dynamic: ({ mouse }) => ({
						"--mouse-x": mouse.local.pos().x,
						"--mouse-y": mouse.local.pos().y,
					}),
				}}
				{...props}
			>
				<span use:rv={{ pos: "relative", zi: "1" }}>{props.children}</span>
			</button>
		</rv.Theme>
	);
};
