import { onCleanup } from "solid-js";
import { createStore, produce } from "solid-js/store";

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

export const createAccessors = (el: Element) => {
	const registered = new Map<Record<string, unknown>, () => void>();

	const [store, setStore] = createStore<{
		mouse: {
			global: {
				pos: { x: number; y: number } | undefined;
				isDown: boolean;
			};
			local: {
				pos: { x: number; y: number } | undefined;
				isDown: boolean;
			};
		};
		scroll: {
			global: {
				pos: { x: number; y: number } | undefined;
			};
			local: {
				pos: { x: number; y: number } | undefined;
			};
		};
	}>({
		mouse: {
			global: {
				pos: undefined,
				isDown: false,
			},
			local: {
				pos: undefined,
				isDown: false,
			},
		},
		scroll: {
			global: {
				pos: undefined,
			},
			local: {
				pos: undefined,
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
					onElement?: Element;
				};
			},
			accessor: () => S
		) =>
		() => {
			for (const [event, update] of Object.entries(subscribers) as [
				E,
				{
					subscriber: (
						state: typeof store,
						event: HTMLElementEventMap[E]
					) => void;
					onElement?: Element;
				}
			][]) {
				if (registered.has(update)) continue;
				if (update.onElement) {
					const listener = (e: Event) => {
						setStore(
							produce((state) =>
								update.subscriber(state, e as HTMLElementEventMap[E])
							)
						);
					};
					update.onElement.addEventListener(event, listener);
					registered.set(update, () => {
						update.onElement?.removeEventListener(event, listener);
					});
				} else {
					const cleanup = SharedListeners.instance.on(event as E, (e) => {
						setStore(produce((state) => update.subscriber(state, e)));
					});
					registered.set(update, cleanup);
				}
			}
			return accessor();
		};

	onCleanup(() => {
		for (const cleanup of registered.values()) {
			cleanup();
		}
	});

	return {
		mouse: {
			global: {
				pos: createAccessor(
					{
						mousemove: {
							subscriber: (state, e) => {
								state.mouse.global.pos = { x: e.clientX, y: e.clientY };
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
							onElement: el,
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
		scroll: {
			global: {
				pos: createAccessor(
					{
						scroll: {
							subscriber: (state) => {
								state.scroll.global.pos = {
									x: window.scrollX,
									y: window.scrollY,
								};
							},
						},
					},
					() => store.scroll.global.pos
				),
			},
			local: {
				pos: createAccessor(
					{
						scroll: {
							subscriber: (state) => {
								state.scroll.global.pos = { x: el.scrollLeft, y: el.scrollTop };
							},
							onElement: el,
						},
					},
					() => store.scroll.global.pos
				),
			},
		},
	};
};

const calculateLocalMousePos = (
	globalMousePos: { x: number; y: number },
	el: Element
) => {
	const rect = el.getBoundingClientRect();
	return { x: globalMousePos.x - rect.left, y: globalMousePos.y - rect.top };
};
