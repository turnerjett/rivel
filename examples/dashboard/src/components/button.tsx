import { rv, values, Theme } from "rivel";
import type { Component, ComponentProps } from "solid-js";

export const Button: Component<ComponentProps<"button">> = (props) => {
	const borderWidth = 1;
	return (
		<Theme elevation={(surface) => surface + 2}>
			<button
				type="button"
				use:rv={{
					bg: values.colors.border.default,
					col: values.colors.text.primary,
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
							bg: values.colors.border.hover,
							boxShadow:
								"0 3px 6px -2px rgb(0, 0, 0, 0.1), 0 2px 4px 0 rgb(0, 0, 0, 0.1)",
						},
						":active": {
							bg: values.colors.border.active,
							boxShadow: "0 2px 4px -2px rgb(0, 0, 0, 0.2)",
						},
						"::before": {
							content: "''",
							op: "var(--opacity)",
							pos: "absolute",
							t: 0,
							l: 0,
							w: "200%",
							aspectRatio: "1",
							background: `radial-gradient(circle, ${values.colors.solid.default} 0%, transparent 50%)`,
							translate:
								"calc(-50% + var(--mouse-x)) calc(-50% + var(--mouse-y))",
							rd: "100%",
						},
						"::after": {
							content: "''",
							pos: "absolute",
							inset: `${borderWidth}px`,
							rd: `calc(0.25rem - ${borderWidth}px)`,
							bg: values.colors.background.default,
							transition: "background-color 0.2s ease-in-out",
						},
						":hover::after": {
							bg: values.colors.background.hover,
						},
						":active::after": {
							bg: values.colors.background.active,
						},
						":active::before": {
							op: 0,
						},
					},
					$dynamic: ({ mouse }) => {
						return {
							"--mouse-x": mouse.local.pos?.x,
							"--mouse-y": mouse.local.pos?.y,
							"--opacity":
								typeof mouse.local.pos?.x === "undefined" ||
								typeof mouse.local.pos?.y === "undefined"
									? "0"
									: "1",
						};
					},
				}}
				{...props}
			>
				<span use:rv={{ pos: "relative", zi: "1" }}>{props.children}</span>
			</button>
		</Theme>
	);
};
