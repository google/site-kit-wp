/**
 * `core/user` data store: adblocker.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * External dependencies
 */
import invariant from 'invariant';
import { detectAnyAdblocker } from 'just-detect-adblock';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from './constants';

// Actions
const CHECK_ADBLOCKER = 'CHECK_ADBLOCKER';
const RECEIVE_IS_ADBLOCKER_ACTIVE = 'RECEIVE_IS_ADBLOCKER_ACTIVE';

export const initialState = {
	isAdBlockerActive: undefined,
};

export const actions = {
	*checkAdBlocker() {
		return yield {
			payload: {},
			type: CHECK_ADBLOCKER,
		};
	},
	receiveIsAdBlockerActive( isAdBlockerActive ) {
		invariant(
			'boolean' === typeof isAdBlockerActive,
			'isAdBlockerActive must be boolean.'
		);
		return {
			payload: { isAdBlockerActive },
			type: RECEIVE_IS_ADBLOCKER_ACTIVE,
		};
	},
};

export const controls = {
	[ CHECK_ADBLOCKER ]: async () => {
		if ( await detectAnyAdblocker() ) {
			return true;
		}
		// The above is good about detecting most adblockers.
		// For the rest, we'll make a placeholder request to the favicon with some
		// additional stuff in the query string to (hopefully) trigger a filter.
		// If this throws, then the fetch request failed completely and we'll assume it was blocked.
		try {
			const params = [
				// The name of the parameter here doesn't really matter
				// since adblockers look at the URL as a whole.
				// Note: this value must not be URL-encoded.
				'google-site-kit=/adsense/pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
				// Add a timestamp for cache-busting.
				`timestamp=${ Date.now() }`,
			];
			await fetch( `/favicon.ico?${ params.join( '&' ) }`, {
				credentials: 'omit',
				// Don't follow any redirects; we only care about this request being blocked or not.
				redirect: 'manual',
			} );
		} catch {
			return true;
		}
		return false;
	},
};

export const reducer = ( state, { payload, type } ) => {
	switch ( type ) {
		case RECEIVE_IS_ADBLOCKER_ACTIVE: {
			const { isAdBlockerActive } = payload;

			return {
				...state,
				isAdBlockerActive,
			};
		}

		default: {
			return state;
		}
	}
};

export const resolvers = {
	*isAdBlockerActive() {
		const registry = yield Data.commonActions.getRegistry();
		const isAdBlockerActive = registry
			.select( CORE_USER )
			.isAdBlockerActive();

		// If the ad blocker status is already set, don't make any requests
		// to check the ad blocker status.
		if ( undefined !== isAdBlockerActive ) {
			return;
		}

		const detected = yield actions.checkAdBlocker();

		yield actions.receiveIsAdBlockerActive( detected );
	},
};

export const selectors = {
	/**
	 * Returns whether an ad blocker is active on the client.
	 *
	 * @since 1.9.0
	 * @since n.e.x.t Selector moved from the `MODULES_ADSENSE` store to the `CORE_USER` store.
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True or false depending on whether an ad blocker is active; `undefined` if not loaded.
	 */
	isAdBlockerActive( state ) {
		const { isAdBlockerActive } = state;
		return isAdBlockerActive;
	},
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
