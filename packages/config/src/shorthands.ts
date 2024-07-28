import type { CSSPropertyShorthands } from "@rivel/core";

export const baseShorthands = {
	// Size
	w: "width",
	h: "height",
	miw: "minWidth",
	maw: "maxWidth",
	mih: "minHeight",
	mah: "maxHeight",

	// Background
	bg: "backgroundColor",
	bgi: "backgroundImage",
	bgp: "backgroundPosition",
	bgs: "backgroundSize",
	bgr: "backgroundRepeat",
	bga: "backgroundAttachment",
	bgc: "backgroundClip",
	bgbm: "backgroundBlendMode",
	bgo: "backgroundOrigin",

	// Border
	bor: "border",
	bw: "borderWidth",
	bs: "borderStyle",
	bc: "borderColor",
	bt: "borderTop",
	btw: "borderTopWidth",
	bts: "borderTopStyle",
	btc: "borderTopColor",
	br: "borderRight",
	brw: "borderRightWidth",
	brs: "borderRightStyle",
	brc: "borderRightColor",
	bb: "borderBottom",
	bbw: "borderBottomWidth",
	bbs: "borderBottomStyle",
	bbc: "borderBottomColor",
	bl: "borderLeft",
	blw: "borderLeftWidth",
	bls: "borderLeftStyle",
	blc: "borderLeftColor",

	// Position
	pos: "position",
	t: "top",
	r: "right",
	b: "bottom",
	l: "left",

	// Flex
	f: "flex",
	fd: "flexDirection",
	fw: "flexWrap",
	fb: "flexBasis",
	fg: "flexGrow",
	fs: "flexShrink",
	ff: "flexFlow",
	jc: "justifyContent",
	ai: "alignItems",
	ac: "alignContent",
	als: "alignSelf",

	// Font
	fof: "fontFamily",
	fos: "fontSize",
	fow: "fontWeight",
	col: "color",

	// Text
	ta: "textAlign",
	td: "textDecoration",
	tdc: "textDecorationColor",
	tdt: "textDecorationThickness",
	tdl: "textDecorationLine",
	tds: "textDecorationStyle",
	tdsi: "textDecorationSkipInk",

	// Padding
	p: "padding",
	pt: "paddingTop",
	pr: "paddingRight",
	pb: "paddingBottom",
	pl: "paddingLeft",
	px: ["paddingLeft", "paddingRight"],
	py: ["paddingTop", "paddingBottom"],

	// Margin
	m: "margin",
	mt: "marginTop",
	mr: "marginRight",
	mb: "marginBottom",
	ml: "marginLeft",
	mx: ["marginLeft", "marginRight"],
	my: ["marginTop", "marginBottom"],

	// Outline
	o: "outline",
	ow: "outlineWidth",
	os: "outlineStyle",
	oc: "outlineColor",
	oo: "outlineOffset",

	// Overflow
	ov: "overflow",
	ovx: "overflowX",
	ovy: "overflowY",

	// Transform
	tr: "transform",
	sc: "scale",
	rot: "rotate",

	// Other
	dis: "display",
	op: "opacity",
	vis: "visibility",
	pe: "pointerEvents",
	cur: "cursor",
	ussel: "userSelect",
} as const satisfies CSSPropertyShorthands;
