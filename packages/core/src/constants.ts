import type { StyleKeys } from "./types";

export const timeRelatedProperties = new Set<StyleKeys>([
	"animationDelay",
	"animationDuration",
	"transitionDelay",
	"transitionDuration",
	"animation",
	"transition",
	"animationTimingFunction",
	"transitionTimingFunction",
]);

export const withoutUnitProperties = new Set<StyleKeys>([
	"opacity",
	"flex",
	"flexGrow",
	"flexShrink",
	"order",
	"zIndex",
	"aspectRatio",
	"columns",
	"fontWeight",
	"lineHeight",
	"scale",
	"rotate",
	"gridColumn",
	"gridRow",
	"gridColumnStart",
	"gridColumnEnd",
	"gridRowStart",
	"gridRowEnd",
	"columnCount",
	"orphans",
	"widows",
	"tabSize",
]);
