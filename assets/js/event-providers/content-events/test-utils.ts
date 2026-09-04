/**
 * Content events test utility functions.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type SiteKitGlobal = typeof global._googlesitekit;

export type RegisteredListener = [ string, EventListener ];

/**
 * Renders markup into the document body and returns the first element.
 *
 * @since n.e.x.t
 *
 * @param {string} markup Markup to render.
 * @return {Element} The rendered markup's first element.
 */
export function render< T extends Element = Element >( markup: string ): T {
	global.document.body.innerHTML = markup;

	return global.document.body.firstElementChild as T;
}

/**
 * Stops jsdom from trying to follow the anchors these tests click.
 *
 * @since n.e.x.t
 *
 * @param {Object} event The click to swallow.
 * @return {void}
 */
export function preventNavigation( event: Event ): void {
	event.preventDefault();
}

/**
 * Tracks the listeners a content event initializer adds to `document`, so a
 * test can remove them again.
 *
 * The content event initializers have no teardown — in production each runs
 * once per page load — so without this every test would leave its listener
 * behind and a later click would be counted once per test that had already
 * run.
 *
 * @since n.e.x.t
 *
 * @return {Object} A tracker with `record`, `reset` and `removeAll`.
 */
export function createListenerTracker() {
	let registered: RegisteredListener[] = [];

	return {
		/**
		 * Runs a content event initializer, recording the listeners it registers.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Function} initializer Content event initializer to run.
		 * @return {Array} The `[ type, listener ]` pairs this call registered.
		 */
		record( initializer: () => void ): RegisteredListener[] {
			const addEventListenerSpy = jest.spyOn(
				global.document,
				'addEventListener'
			);

			initializer();

			const added: RegisteredListener[] =
				addEventListenerSpy.mock.calls.map( ( [ type, listener ] ) => [
					type as string,
					listener as EventListener,
				] );

			// Restoring first would wipe `mock.calls`.
			addEventListenerSpy.mockRestore();
			registered.push( ...added );

			return added;
		},

		/**
		 * Forgets every recorded listener, leaving them attached to `document`.
		 *
		 * @since n.e.x.t
		 *
		 * @return {void}
		 */
		reset(): void {
			registered = [];
		},

		/**
		 * Removes every recorded listener from `document`.
		 *
		 * @since n.e.x.t
		 *
		 * @return {void}
		 */
		removeAll(): void {
			registered.forEach( ( [ type, listener ] ) =>
				global.document.removeEventListener( type, listener )
			);
			registered = [];
		},
	};
}
