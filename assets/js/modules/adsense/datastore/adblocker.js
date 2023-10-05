/**
 * `modules/adsense` data store: adblocker.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';

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
			.select( MODULES_ADSENSE )
			.isAdBlockerActive();

		// If ad blocker status was already detected, consider it fulfilled
		// and don't check the global.
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
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} True or false depending on whether an ad blocker is active; `undefined` if not loaded.
	 */
	isAdBlockerActive( state ) {
		const { isAdBlockerActive } = state;
		return isAdBlockerActive;
	},

	/**
	 * Returns appropriate ad blocker warning message based on modules connection status.
	 *
	 * @since 1.43.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The error message string if an ad blocker is active,
	 *                                   `null` if an ad blocker isn't detected,
	 *                                   `undefined` if ad blocker detection has not completed yet.
	 */
	getAdBlockerWarningMessage: Data.createRegistrySelector(
		( select ) => () => {
			const isAdBlockerActive =
				select( MODULES_ADSENSE ).isAdBlockerActive();

			if ( undefined === isAdBlockerActive ) {
				return undefined;
			}

			if ( ! isAdBlockerActive ) {
				return null;
			}

			const isModuleConnected =
				select( CORE_MODULES ).isModuleConnected( 'adsense' );

			if ( isModuleConnected ) {
				return __(
					'Ad blocker detected; please disable it to get the latest AdSense data',
					'google-site-kit'
				);
			}

			return __(
				'Ad blocker detected; please disable it to set up AdSense',
				'google-site-kit'
			);
		}
	),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
