# Rivel

A type-safe SolidJS styling library for creating dynamic user interfaces.

> [!WARNING]
> **This library is still under development and is not yet available on NPM. Breaking changes are likely to occur.**

## Introduction

Rivel allows you to create highly customizable and dynamic styles for your SolidJS applications using a simple and intuitive API. Rivel makes extensive use of SolidJS's reactive system to create a highly dynamic and customizable styling experience through the use of signals, context, and directives.

Behind the scenes, Rivel generates atomic CSS classes that are dynamically applied to your components based on the styles you define. This approach ensures that your styles are highly efficient and performant, as only the necessary classes are applied to your components.

## Features

- [x] Type-safe style directive
- [x] Dynamic themes and palettes
- [x] Nested Themes
- [x] Breakpoints
- [x] CSS Selectors
- [x] Direct access to event based values
- [x] Customizable shorthands
- [x] Raw CSS escape hatch
- [x] Color elevation

### Planned

- [ ] Dynamic size values
- [ ] Dynamic typography values
- [ ] Variants
- [ ] SSR Support
- [ ] Build-time CSS generation

## Getting Started

### Installation

#### npm
```zsh
npm install rivel @rivel/config
```

#### yarn

```zsh
yarn add rivel @rivel/config
```

#### pnpm

```zsh
pnpm add rivel @rivel/config
```

#### bun

```zsh
bun add rivel @rivel/config
```

### Config Quickstart

``` typescript
// rivel.config.ts

import { createConfig } from "rivel";
import { defaultConfig } from "@rivel/config";

export const config = createConfig(defaultConfig);

type RivelCustomConfig = typeof config;

declare module "@rivel/core" {
	export interface RivelConfig extends RivelCustomConfig {}
}
```

### Provider Setup

```typescript
// App.tsx

import config from "./rivel.config";
import { RivelProvider } from "rivel";

export default function App() {
    return ( 
        <RivelProvider config={config}>
            ...
        </RivelProvider>
    )
}
```

### Usage

```typescript
// button.tsx

import { rv, values, Theme, type ThemeName } from "rivel";
import { 
    splitProps, 
    type Component, 
    type ComponentProps,
} from "solid-js";

type ButtonProps = ComponentProps<"button"> & {
    theme?: ThemeName;
};

export const Button: Component<ButtonProps> = (props) => {
    const [split, rest] = splitProps(props, ["theme"]);

    return (
        <Theme name={split.theme} elevation={(surface) => surface + 2}>
            <button 
                use:rv={{
                    bg: values.colors.background.default,
                    col: values.colors.text.primary,
                    px: 0.75,
                    py: 0.25,
                    rd: 0.25,
                }} 
                {...rest}
            />
        </Theme>
    )
}
```

> [!NOTE]
> Unless you are using the Vite plugin, `rv` must be imported for the directive to work. **This plugin is still under development and is not yet available for use.**

## Documentation

### Config

The config is where you define your theme values and options for library. It consists of a few main concepts:

- **Schemes**
- **Themes**
- **Values**
- **Shorthands**
- **Breakpoints**
- **Options**

#### Schemes

Schemes are groups of palettes that can be dynamically applied to you styles. The most common schemes are light and dark, but any name is allowed. Schemes are defined in the **palettes** section of the config.

```typescript
const config = createConfig({
    palettes: {
        light: {
            neutral: gray,
            blue: blue,
            green: green,
            yellow: yellow,
            red: red,
        },
        dark: {
            neutral: grayDark,
            blue: blueDark,
            green: greenDark,
            yellow: yellowDark,
            red: redDark,
        }
    }
    ...
})
```

In this example, we have defined two schemes, light and dark, with the neutral, green, blue, yellow, and red palettes. The palette keys defined within the scheme objects must match or else you will get a type error. The values of the palettes must be an array of CSS compatible color values. The length of the palettes should also match as they will be dynamically swapped with each other.

#### Themes

Themes are the main way to apply styles to your components. They are defined in the **themes** section of the config.

```typescript
const config = createConfig({
    ...
    themes: {
        base: {
            palette: "neutral",
        },
        info: {
            palette: "blue",
        },
        success: {
            palette: "green",
        },
        warning: {
            palette: "yellow",
        },
        danger: {
            palette: "red",
        },
    }
    ...
})
```

In this example, we have defined five themes, base, info, success, warning, and danger. The palette used will depend on the active scheme set.

#### Values

Values are the primary way of accessing the values within your config. These are defined in the **values** section of the config. It requires you to pass it a function that returns an object that defines the values you want to access. The config's values can be accessed in the functions arguments.

```typescript
const config = createConfig({
    ...
    values: ({ palette }) => ({
        colors: {
            background: {
                default: palette[0],
                hover: palette[2],
                active: palette[1],
            },
            text: {
                secondary: palette[10],
                primary: palette[11],
            },
        },
    })
    ...
})
```

There is no specific format for the values object, but it is recommended to group values by their purpose. For example, colors, spacing, and typography are common groupings. These values can be access through the `values` object that can be imported from `rivel`. The object uses a proxy under the hood which makes the values reactive and dynamic.

#### Shorthands

> *Optional*

Shorthands can be used to map a key to one or more CSS properties. Shorthands are defined in the **shorthands** section of the config.

```typescript
const config = createConfig({
    ...
    shorthands: {
        bg: "backgroundColor",
        rd: "borderRadius",
        px: ["paddingLeft", "paddingRight"],
        py: ["paddingTop", "paddingBottom"],
    }
    ...
})
```

Check out [this file](packages/config/src/shorthands.ts) for an example of all of the shorthands used in the default config.

#### Breakpoints

> *Optional*

Breakpoints allow you to define a list of breakpoints that will be converted into CSS media queries. These are defined in the **breakpoints** section of the config.

```typescript
const config = createConfig({
    ...
    breakpoints: {
        xs: 520,
        sm: 768,
        md: 1024,
        lg: 1280,
        xl: 1640,
    }
    ...
})
```
The keys will be available as special properties on the `rv` directive, prefixed with `$`.

> [!NOTE]
> The sizing unit for the breakpoints is pixels, regardless of the sizing unit set in the **options** section of the config.

#### Options

> *Optional*

The **options** section allows you to configure the library's behavior.

| Property | Options | Default |
| -------- | ------- | ------- |
| cssSizingUnit | "px" \| "rem" | "rem" |
| cssTimingUnit | "s" \| "ms" | "ms" |

#### Default Config

Most of the time, the default config should be sufficient. However, if you need to change anything about the default config, you can pass a second argument to the `createConfig` function to override the default config.

```typescript
const config = createConfig(defaultConfig, {
    ...
});
```

### RV Directive

The primary way of applying styles to element is through using the `rv` directive. The properties that are available on the directive can be split into two categories, style properties and special properties.

#### Style Properties

Style properties are the properties that are used to define the styles for the element. All of the standard CSS properties are available along with the shorthands defined in the config.

```typescript
const Component = () => {
    return (
        <div use:rv={{
            bg: "red",
            col: "white",
        }}>
            Hello World
        </div>
    )
}
```

These styles are converted into atomic CSS classes, added to a style sheet, and applied to the element. If a style property is removed, the style sheet will be updated to remove the property.

> [!NOTE]
> The atomic class names that are generated in development are not minified. This is to allow for easier debugging. In production, these values will be minified and converted into classes that are not human readable, making them easier to hash.

#### Special Properties

Special properties are available on the `rv` directive and are prefixed with `$`. These properties provide convenient ways to apply complex styles. The functionality of these properties include applying:

- Breakpoint values
- CSS selectors
- Event based values
- Raw CSS

##### Breakpoint Values

The breakpoint property names map directly to the ones that are provided in the config. The specificity is order from the smallest value to the largest so that you don't need to worry about the order that you apply these in the directive.

```typescript
const Component = () => {
    return (
        <div use:rv={{
            $sm: {
                bg: "red",
            },
            $md: {
                bg: "green",
            },
            $lg: {
                bg: "blue",
            },
        }}>
            Hello World
        </div>
    )
}
```

#### CSS Selectors

Rivel provides a few convinient ways to apply CSS selectors to your styles. these include the `$select`, `$parentSelect`, and `$ancestorSelect` properties.

`$select` allows you to apply a CSS selector to the element itself. For example, this:

```typescript
const Component = () => {
    return (
        <div use:rv={{
            $select: {
               ":hover": {
                   bg: "red",
               },
            },
        }} />
    )
}
```

will be converted into this:

```css
.class-hash:hover {
    background-color: red;
}
```

`$parentSelect` allows you to apply styles based on the parent element's state. For example, this:

```typescript
const Component = () => {
    return (
        <div
            use:rv={{
                $parentSelect: {
                    ":hover": {
                        bg: "red",
                    },
                },
            }}
        />
    )
}
```

will be converted into this:

```css
:hover > .class-hash {
    background-color: red;
}
```

`$ancestorSelect` allows you to apply styles based on the state of any of the element's ancestors. For example, this:

```typescript
const Component = () => {
    return (
        <div
            use:rv={{
                $ancestorSelect: {
                    ":hover": {
                        bg: "red",
                    },
                },
            }}
        />
    )
}
```

will be converted into this:

```css
:hover .class-hash {
    background-color: red;
}
```

It is possible to use multiple selectors as you would in CSS, but as soon as you add more than one selector, you loose type safety. These three properties can also be nested within each other to create complex selectors, and each level will be appended to its related parent. For example, if you were to nest a `$select` within a `$select`, the selector in the nested select will be appended to the parent selector. The order that the selectors are applied is `$ancestorSelect`, `$parentSelect`, and `$select`.

```typescript
const Component = () => {
    return (
        <div
            use:rv={{
                $select: {
                    "::after": {
                        bg: "red",
                        $select: {
                            ":hover": {
                                bg: "green",
                            },
                        },
                    },
                },
            }}
        />
    )
}
```

will become:

```css
.class-hash::after {
    background-color: red;
}

.class-hash::after:hover {
    background-color: green;
}
```

For a more complex example, this:

```typescript
const Component = () => {
    return (
        <div
            use:rv={{
                $select: {
                    "::after": {
                        bg: "red",
                        $ancestorSelect: {
                            ":active": {
                                bg: "blue",
                                $parentSelect: {
                                    ":hover:focus": {
                                        bg: "green",
                                    },
                                },
                            },
                        },
                    },
                },
            }}
        />
    )
}
```

will become:

```css
.class-hash::after {
    background-color: red;
}

:active .class-hash::after {
    background-color: blue;
}

:active :hover:focus > .class-hash::after {
    background-color: green;
}
```

> [!TIP]
> Although select properties allow you to create complex selector combinations, they can become difficult to read and maintain. Check out the `$raw` property to apply raw CSS to your styles.

#### Event Based Values

Rivel provides a powerful feature that allows you to extract and use dynamic values from events directly in your styles. This is done through the `$dynamic` property. It takes a callback that returns a style object as an argument and provides the dynamic values as arguments to the callback. These arguments are signals that lazily create event listeners only when the signal is accessed. Due to the frequency that these values may update, the styles are applied directly to the element rather than being converted to atomic class names.

The values provided are objects that follow this format:  
***Category > Scope > Value***

The **Category** is where the value is coming from. For example, to get the mouse position, the category would be `mouse`. The scope is what the value is relative to. For example, using `global` will give me the position of the mouse relative to the entire page, whereas using `local` will give me the position relative to the element. The **Value** is the actual value that is being extracted from the event. This could be a primitive value, such as a number or a boolean, or, in the case of the mouse position, an object `pos` with the x and y position. The value uses a getter to create the event listener and trigger the signal when the value is accessed.

> [!IMPORTANT]
> Be aware that values that don't have an obvious default value, such as the mouse position, will be undefined until the initial event is triggered. For events that have a likely default value, such as isDown on the `mouse` category, will have a default value, such as `false` in the case of isDown.

#### Raw CSS

By using the `$raw` property, you can apply raw CSS to your styles. This is useful for applying styles that require complex selectors or media queries. This property takes either a string for a single rule or an array of strings for multiple rules. Use the `&` character to mark where the class name should be inserted.

```typescript
const Component = () => {
    return (
        <div use:rv={{
            $raw: [
                "&:hover { background-color: red; }",
                "&:focus { background-color: green; }",
                "&:active { background-color: blue; }",
            ],
        }} />
    )
}
```

The `$raw` property should be used sparingly as it can make your styles difficult to read and maintain. It provides no type safety and can be difficult to debug as the class names are not human readable. It is also unoptimized compared to the other properties.
