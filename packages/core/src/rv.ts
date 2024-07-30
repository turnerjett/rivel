import { type Accessor, createRenderEffect, onCleanup } from "solid-js";
import type { Breakpoints, GenericConfig } from "./config";
import type { SpecialProperties, StyleKeys, Styles } from "./types";
import {
	generateAtomicClassNames,
	removeClasses,
	timeRelatedProperties,
} from "./css";
import { createStore, produce } from "solid-js/store";
import { toKebabCase } from "./utils";

export const rvStylesWithConfig = <
	S extends Styles,
	BP extends Breakpoints | undefined
>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: GenericConfig
) => {
	updateClasses(el, styles, config);
	updateStyles(el, styles, config);
};

const updateClasses = <S extends Styles, BP extends Breakpoints | undefined>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: GenericConfig
) => {
	let prevClassNames: string[] = [];
	createRenderEffect(() => {
		const classNames = generateAtomicClassNames(
			styles(),
			prevClassNames,
			config
		);
		if (prevClassNames.length > 0) {
			const removed = prevClassNames.filter(
				(className) => !classNames.includes(className)
			);
			removeClasses(removed);
			el.classList.remove(...removed);
		}
		el.classList.add(...classNames);
		prevClassNames = classNames;
	});
};

class SharedListeners {
	listeners = new Map<
		keyof HTMLElementEventMap,
		{
			listener: (e: Event) => void;
			subscriptions: Set<(e: Event) => void>;
		}
	>();

	private static _instance: SharedListeners | null = null;
	static get instance() {
		if (SharedListeners._instance === null) {
			SharedListeners._instance = new SharedListeners();
		}
		return SharedListeners._instance;
	}

	on<K extends keyof HTMLElementEventMap>(
		key: K,
		subscription: (e: HTMLElementEventMap[K]) => void
	) {
		if (!this.listeners.has(key)) {
			this.listeners.set(key, {
				listener: (e: Event) => {
					const subscriptions = this.listeners.get(key)?.subscriptions;
					if (!subscriptions) return;
					for (const subscription of subscriptions) {
						subscription(e);
					}
				},
				subscriptions: new Set([subscription as (e: Event) => void]),
			});
			// biome-ignore lint/style/noNonNullAssertion: the listener is set above
			document.addEventListener(key, this.listeners.get(key)!.listener);
		}
		this.listeners
			.get(key)
			?.subscriptions.add(subscription as (e: Event) => void);
		return () => {
			this.listeners
				.get(key)
				?.subscriptions.delete(subscription as (e: Event) => void);
			if (this.listeners.get(key)?.subscriptions.size === 0) {
				// biome-ignore lint/style/noNonNullAssertion: the listener can't be undefined here
				document.removeEventListener(key, this.listeners.get(key)!.listener);
				this.listeners.delete(key);
			}
		};
	}
}

const updateStyles = <S extends Styles, BP extends Breakpoints | undefined>(
	el: Element,
	styles: Accessor<S & SpecialProperties<S, BP>>,
	config: GenericConfig
) => {
	let previousStyleKeys: Set<StyleKeys> = new Set();

	const registered = new Map<() => unknown, () => void>();

	const [store, setStore] = createStore({
		mouse: {
			global: {
				pos: { x: 0, y: 0 },
				isDown: false,
			},
			local: {
				pos: { x: 0, y: 0 },
				isDown: false,
			},
		},
	});

	const createAccessor =
		<E extends keyof HTMLElementEventMap, S>(
			subscribers: {
				[K in E]: {
					subscriber: (
						state: typeof store,
						event: HTMLElementEventMap[K]
					) => void;
					onElement?: boolean;
				};
			},
			accessor: () => S
		) =>
		() => {
			if (!registered.has(accessor)) {
				for (const [event, update] of Object.entries(subscribers) as [
					E,
					{
						subscriber: (
							state: typeof store,
							event: HTMLElementEventMap[E]
						) => void;
						onElement?: boolean;
					}
				][]) {
					if (update.onElement) {
						const listener = (e: Event) => {
							setStore(
								produce((state) =>
									update.subscriber(state, e as HTMLElementEventMap[E])
								)
							);
						};
						el.addEventListener(event, listener);
						registered.set(accessor, () => {
							el.removeEventListener(event, listener);
						});
					} else {
						const cleanup = SharedListeners.instance.on(event as E, (e) => {
							setStore(produce((state) => update.subscriber(state, e)));
						});
						registered.set(accessor, cleanup);
					}
				}
			}
			return accessor();
		};

	const accessors = {
		mouse: {
			global: {
				pos: createAccessor(
					{
						mousemove: {
							subscriber: (state, e) => {
								state.mouse.global.pos.x = e.clientX;
								state.mouse.global.pos.y = e.clientY;
							},
						},
					},
					() => store.mouse.global.pos
				),
				isDown: createAccessor(
					{
						mousedown: {
							subscriber: (state) => {
								state.mouse.global.isDown = true;
							},
						},
						mouseup: {
							subscriber: (state) => {
								state.mouse.global.isDown = false;
							},
						},
					},
					() => store.mouse.global.isDown
				),
			},
			local: {
				pos: createAccessor(
					{
						mousemove: {
							subscriber: (state, e) => {
								state.mouse.local.pos = calculateLocalMousePos(e, el);
							},
						},
					},
					() => store.mouse.local.pos
				),
				isDown: createAccessor(
					{
						mousedown: {
							subscriber: (state) => {
								state.mouse.local.isDown = true;
							},
							onElement: true,
						},
						mouseup: {
							subscriber: (state) => {
								state.mouse.local.isDown = false;
							},
						},
					},
					() => store.mouse.local.isDown
				),
			},
		},
	};

	createRenderEffect(() => {
		const s = styles();
		if (typeof s.$dynamic === "function") {
			const dynamicStyles = s.$dynamic({
				...accessors,
			});
			const newKeys = updateElementStyles(
				el as HTMLElement,
				dynamicStyles,
				previousStyleKeys,
				config
			);
			previousStyleKeys = newKeys;
		}
	});

	onCleanup(() => {
		for (const cleanup of registered.values()) {
			cleanup();
		}
	});
};

const updateElementStyles = (
	el: HTMLElement,
	styles: Styles,
	previousStyleKeys: Set<StyleKeys>,
	config: GenericConfig
) => {
	const style = el.style;
	const newKeys = new Set<StyleKeys>();
	for (const [key, value] of Object.entries(styles)) {
		if (previousStyleKeys.has(key as StyleKeys)) {
			previousStyleKeys.delete(key as StyleKeys);
		}
		if (typeof value === "number") {
			if (timeRelatedProperties.has(key as StyleKeys)) {
				setStyleProperty(
					el,
					key as StyleKeys,
					`${value}${config.options?.cssTimeUnit}`,
					newKeys,
					config
				);
			} else {
				setStyleProperty(el, key as StyleKeys, `${value}px`, newKeys, config);
			}
		} else {
			setStyleProperty(el, key as StyleKeys, value, newKeys, config);
		}
	}
	for (const key of previousStyleKeys) {
		if (newKeys.has(key)) continue;
		style.removeProperty(toKebabCase(key));
	}
	return newKeys;
};

const setStyleProperty = (
	el: HTMLElement,
	key: StyleKeys,
	value: string,
	newKeys: Set<StyleKeys>,
	config: GenericConfig
) => {
	const realKey = handleShorthandKey(key, config);
	if (typeof realKey === "string") {
		const kebabKey = toKebabCase(realKey);
		el.style.setProperty(kebabKey, value);
		newKeys.add(kebabKey as StyleKeys);
	} else {
		for (const k of realKey) {
			const kebabKey = toKebabCase(k);
			el.style.setProperty(kebabKey, value);
			newKeys.add(kebabKey as StyleKeys);
		}
	}
};

const handleShorthandKey = (key: StyleKeys, config: GenericConfig) => {
	if (!config.shorthands || !config.shorthands[key]) return key;
	return config.shorthands[key];
};

const calculateLocalMousePos = (
	globalMousePos: { x: number; y: number },
	el: Element
) => {
	const rect = el.getBoundingClientRect();
	return { x: globalMousePos.x - rect.left, y: globalMousePos.y - rect.top };
};
