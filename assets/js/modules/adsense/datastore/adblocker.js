/**
 * `modules/adsense` data store: adblocker.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';

// Actions
const RECEIVE_IS_ADBLOCKER_ACTIVE = 'RECEIVE_IS_ADBLOCKER_ACTIVE';

export const initialState = {
	isAdBlockerActive: undefined,
};

export const actions = {
	receiveIsAdBlockerActive( isAdBlockerActive ) {
		invariant( 'boolean' === typeof isAdBlockerActive, 'isAdBlockerActive must be boolean.' );
		return {
			payload: { isAdBlockerActive },
			type: RECEIVE_IS_ADBLOCKER_ACTIVE,
		};
	},
};

export const controls = {};

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
		const isAdBlockerActive = registry.select( STORE_NAME ).isAdBlockerActive();

		// If ad blocker status was already detected, consider it fulfilled
		// and don't check the global.
		if ( undefined !== isAdBlockerActive ) {
			return;
		}

		// Global is set by ads.js entry point script.
		const canAdsRun = global._googlesitekitLegacyData && global._googlesitekitLegacyData.canAdsRun;

		yield actions.receiveIsAdBlockerActive( ! canAdsRun );
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
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
