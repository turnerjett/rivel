import { RivelProvider, Theme } from "@rivel/core";
import { config, rv } from "../rivel.config";
import { Button } from "./components/button";
import { invert } from "@rivel/utils";

export default function App() {
	return <Page />;
}

const Page = () => {
	return (
		<RivelProvider config={config}>
			<Theme scheme="darkAlt">
				<div
					use:rv={{
						h: "100vh",
						w: "100vw",
						dis: "flex",
						jc: "center",
						ai: "center",
						fd: "column",
						bg: rv.colors().background.default,
						gap: 1,
					}}
				>
					<Theme elevation={1}>
						<ButtonGroup />
						<Theme scheme={(scheme) => invert(scheme)}>
							<ButtonGroup />
						</Theme>
					</Theme>
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
				bc: rv.colors().border.default,
				bg: rv.colors().background.default,
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
