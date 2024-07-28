import { rv } from "../rivel.config";
import { createSignal } from "solid-js";

export default function App() {
	const [theme, setTheme] = createSignal<"blue" | "base">("blue");
	const [elevation, setElevation] = createSignal(0);
	const toggleTheme = () => {
		setTheme(theme() === "blue" ? "base" : "blue");
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
				}}
			>
				<rv.Theme name={theme()} scheme="dark" elevation={elevation()}>
					<Page />
				</rv.Theme>
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
			w: "10rem",
			h: "10rem",
			$sm: {
				w: "15rem",
				h: "15rem",
			},
			$md: {
				w: "20rem",
				h: "20rem",
			},
			bg: rv.colors().background.default,
			bc: rv.colors().border.default,
			bw: "1px",
			bs: "solid",
			col: rv.colors().textPrimary,
		}}
	>
		<rv.Theme elevation={(surface) => surface + 2}>
			<div
				use:rv={{
					col: rv.colors().textPrimary,
					bg: rv.colors().background.default,
					ta: "center",
				}}
			>
				Test
			</div>
		</rv.Theme>
	</div>
);
