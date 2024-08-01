import type {
	Breakpoints,
	CSSPropertyShorthands,
	Config,
	Values,
} from "@rivel/core";
import { baseShorthands } from "./shorthands";
import {
	gray,
	grayDark,
	red,
	redDark,
	orange,
	orangeDark,
	yellow,
	yellowDark,
	green,
	greenDark,
	blue,
	blueDark,
	indigo,
	indigoDark,
	violet,
	violetDark,
	slate,
	slateDark,
	ruby,
	rubyDark,
	tomato,
	tomatoDark,
	amber,
	amberDark,
	jade,
	jadeDark,
	sky,
	skyDark,
	iris,
	irisDark,
	purple,
	purpleDark,
} from "@radix-ui/colors";

export const createConfigObject = <
	SK extends string,
	PK extends string,
	TK extends string,
	V extends Values,
	SH extends CSSPropertyShorthands | undefined,
	BP extends Breakpoints | undefined
>(
	config: Config<SK, PK, TK, V, SH, BP>
) => {
	return config;
};

export const defaultConfig = createConfigObject({
	palettes: {
		light: {
			neutral: Object.values(gray),
			red: Object.values(red),
			orange: Object.values(orange),
			yellow: Object.values(yellow),
			green: Object.values(green),
			blue: Object.values(blue),
			indigo: Object.values(indigo),
			violet: Object.values(violet),
		},
		dark: {
			neutral: Object.values(grayDark),
			red: Object.values(redDark),
			orange: Object.values(orangeDark),
			yellow: Object.values(yellowDark),
			green: Object.values(greenDark),
			blue: Object.values(blueDark),
			indigo: Object.values(indigoDark),
			violet: Object.values(violetDark),
		},
		lightAlt: {
			neutral: Object.values(slate),
			red: Object.values(ruby),
			orange: Object.values(tomato),
			yellow: Object.values(amber),
			green: Object.values(jade),
			blue: Object.values(sky),
			indigo: Object.values(iris),
			violet: Object.values(purple),
		},
		darkAlt: {
			neutral: Object.values(slateDark),
			red: Object.values(rubyDark),
			orange: Object.values(tomatoDark),
			yellow: Object.values(amberDark),
			green: Object.values(jadeDark),
			blue: Object.values(skyDark),
			indigo: Object.values(irisDark),
			violet: Object.values(purpleDark),
		},
	},
	themes: {
		base: {
			palette: "neutral",
		},
		success: {
			palette: "green",
		},
		danger: {
			palette: "red",
		},
		warning: {
			palette: "yellow",
		},
		info: {
			palette: "blue",
		},
		red: {
			palette: "red",
		},
		orange: {
			palette: "orange",
		},
		yellow: {
			palette: "yellow",
		},
		green: {
			palette: "green",
		},
		blue: {
			palette: "blue",
		},
		indigo: {
			palette: "indigo",
		},
		violet: {
			palette: "violet",
		},
	},
	values: ({ palette }) => ({
		colors: {
			background: {
				default: palette[0],
				hover: palette[2],
				active: palette[1],
			},
			border: {
				default: palette[3],
				hover: palette[5],
				active: palette[4],
			},
			solid: {
				default: palette[6],
				hover: palette[8],
				active: palette[7],
			},
			contrast: {
				default: palette[10],
				hover: palette[11],
				active: palette[9],
			},
			textSecondary: palette[10],
			textPrimary: palette[11],
		},
	}),
	shorthands: baseShorthands,
	breakpoints: {
		xs: 520,
		sm: 768,
		md: 1024,
		lg: 1280,
		xl: 1640,
	},
});
