/**
 * Utilities for tracking timeouts.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

/**
 * Sets up global functions to track timeouts and wait for them to complete.
 *
 * This adds the global function `useTrackedTimeouts`, which will replace the
 * global `setTimeout` and `clearTimeout` functions with versions that track
 * the timeouts.
 *
 * `useTrackedTimeouts` also adds two global functions to the global scope:
 * `hasTimeouts` and `waitForTimeouts`.
 *
 * `hasTimeouts` returns true if there are any timeouts currently active.
 *
 * `waitForTimeouts` returns a Promise that resolves when all timeouts have
 * completed.
 *
 * @since n.e.x.t
 *
 * @return {void}
 */
export function setupTimeoutTracker() {
	global.useTrackedTimeouts = () => {
		const originalTimeoutAPI = {
			setTimeout: global.setTimeout,
			clearTimeout: global.clearTimeout,
		};

		const timeouts = new Set();

		global.setTimeout = ( handler, timeout ) => {
			const id = originalTimeoutAPI.setTimeout( () => {
				handler();
				timeouts.delete( id );
			}, timeout );

			timeouts.add( id );
			return id;
		};

		global.clearTimeout = ( id ) => {
			originalTimeoutAPI.clearTimeout( id );
			timeouts.delete( id );
		};

		global.hasTimeouts = () => timeouts.size > 0;

		global.waitForTimeouts = async () => {
			while ( global.hasTimeouts() ) {
				await new Promise( ( resolve ) => {
					originalTimeoutAPI.setTimeout( resolve, 1 );
				} );
			}
		};
	};
}
