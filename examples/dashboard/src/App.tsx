import { rv } from "../rivel.config";
import { createSignal } from "solid-js";

export default function App() {
	const [theme, setTheme] = createSignal<"blue" | "base">("blue");
	const [scheme, setScheme] = createSignal<"dark" | "light">("dark");
	const [elevation, setElevation] = createSignal(0);
	const toggleTheme = () => {
		setTheme(theme() === "blue" ? "base" : "blue");
	};
	const toggleScheme = () => {
		setScheme(scheme() === "dark" ? "light" : "dark");
	};
	const raise = () => setElevation(elevation() + 1);
	const lower = () => setElevation(elevation() - 1);
	return (
		<rv.Theme scheme="dark">
			<div
				use:rv={{
					w: "100vw",
					h: "100vh",
					bg: rv.colors().background.default,
					dis: "flex",
					fd: "column",
					jc: "center",
					ai: "center",
					gap: "1rem",
					col: rv.colors().textPrimary,
				}}
			>
				<rv.Theme name={theme()} scheme={scheme()} elevation={elevation()}>
					<Page />
				</rv.Theme>
				<button type="button" onClick={toggleScheme}>
					Toggle scheme
				</button>
				<button type="button" onClick={toggleTheme}>
					Toggle theme
				</button>
				<button type="button" onClick={raise}>
					Raise
				</button>
				<button type="button" onClick={lower}>
					Lower
				</button>
			</div>
		</rv.Theme>
	);
}

const Page = () => (
	<div
		use:rv={{
			w: 10,
			h: 10,
			transitionDuration: 200,
			transitionTimingFunction: "ease-in-out",
			transitionProperty: "all",
			$sm: {
				w: 15,
				h: 15,
			},
			$md: {
				w: 20,
				h: 20,
				$select: {
					":hover": {
						bg: rv.colors().solid.default,
					},
				},
			},
			bg: rv.colors().background.default,
			bc: rv.colors().border.default,
			bw: "1px",
			bs: "solid",
			col: rv.colors().textPrimary,
			$select: {
				":hover": {
					bg: rv.colors().background.hover,
				},
				"::after": {
					content: "''",
					dis: "block",
					w: "100%",
					h: "10%",
					bg: rv.colors().solid.default,
				},
			},
		}}
	>
		<rv.Theme elevation={(surface) => surface + 2}>
			<div
				use:rv={{
					col: rv.colors().textPrimary,
					bg: rv.colors().background.default,
					ta: "center",
					p: "1rem",
					$parentSelect: {
						":hover": {
							bg: rv.colors().background.hover,
						},
					},
				}}
			>
				Test
			</div>
		</rv.Theme>
	</div>
);
