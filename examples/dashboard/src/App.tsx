import { rv } from "../rivel.config";
import { Button } from "./components/button";
import { invert } from "@rivel/utils";

export default function App() {
	return <Page />;
}

const Page = () => {
	return (
		<rv.Theme scheme="darkAlt">
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
				<rv.Theme elevation={1}>
					<ButtonGroup />
					<rv.Theme scheme={(scheme) => invert(scheme)}>
						<ButtonGroup />
					</rv.Theme>
				</rv.Theme>
			</div>
		</rv.Theme>
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
			<rv.Theme name="base">
				<Button>Button</Button>
			</rv.Theme>
			<rv.Theme name="info">
				<Button>Button</Button>
			</rv.Theme>
			<rv.Theme name="success">
				<Button>Button</Button>
			</rv.Theme>
			<rv.Theme name="warning">
				<Button>Button</Button>
			</rv.Theme>
			<rv.Theme name="danger">
				<Button>Button</Button>
			</rv.Theme>
		</div>
	);
};
