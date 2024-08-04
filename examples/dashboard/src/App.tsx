import { RivelProvider, Theme } from "@rivel/core";
import { config } from "../rivel.config";
import { Button } from "./components/button";
import { invert } from "@rivel/utils";
import { rv, values } from "@rivel/core";
import { createSignal } from "solid-js";

export default function App() {
	return <Page />;
}
const Page = () => {
	const [scheme, setScheme] = createSignal<"lightAlt" | "darkAlt">("darkAlt");
	const [theme, setTheme] = createSignal<"base" | "blue">("base");
	const toggleScheme = () => setScheme(invert(scheme()));
	const toggleTheme = () => setTheme(theme() === "base" ? "blue" : "base");
	return (
		<RivelProvider config={config}>
			<Theme scheme={scheme()} name={theme()}>
				<div
					use:rv={{
						h: "100vh",
						w: "100vw",
						dis: "flex",
						jc: "center",
						ai: "center",
						fd: "column",
						bg: values.colors.background.default,
						gap: 1,
					}}
				>
					<Theme elevation={1}>
						<ButtonGroup />
						<Theme scheme={(scheme) => invert(scheme)}>
							<ButtonGroup />
						</Theme>
					</Theme>
					<Button onClick={toggleScheme}>Toggle Scheme</Button>
					<Button onClick={toggleTheme}>Toggle Theme</Button>
				</div>
			</Theme>
		</RivelProvider>
	);
};

const ButtonGroup = () => {
	return (
		<div
			use:rv={{
				dis: "flex",
				gap: 1,
				p: 1,
				bs: "solid",
				bw: "1px",
				bc: values.colors.border.default,
				bg: values.colors.background.default,
				rd: 0.5,
			}}
		>
			<Theme name="base">
				<Button>Button</Button>
			</Theme>
			<Theme name="info">
				<Button>Button</Button>
			</Theme>
			<Theme name="success">
				<Button>Button</Button>
			</Theme>
			<Theme name="warning">
				<Button>Button</Button>
			</Theme>
			<Theme name="danger">
				<Button>Button</Button>
			</Theme>
		</div>
	);
};
