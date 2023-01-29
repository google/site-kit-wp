/**
 * `modules/analytics` data store: adsense.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from './constants';
const { createRegistryControl } = Data;

// Actions
const SET_ADSENSE_LINKED = 'SET_ADSENSE_LINKED';
// A private action to get settings asynchronously.
// TODO: Refactor this once we have dedicated actions for this.
const __ADSENSE_LINKED_GET_RESOLVED_SETTINGS = '__ADSENSE_LINKED_GET_SETTINGS';

export const initialState = {
	adsenseLinked: undefined,
};

export const actions = {
	setAdsenseLinked( linked ) {
		return {
			payload: {
				adsenseLinked: !! linked,
			},
			type: SET_ADSENSE_LINKED,
		};
	},
};

export const controls = {
	// TODO: Refactor this once we have dedicated actions for this.
	[ __ADSENSE_LINKED_GET_RESOLVED_SETTINGS ]: createRegistryControl(
		( registry ) => () => {
			return registry.resolveSelect( MODULES_ANALYTICS ).getSettings();
		}
	),
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_ADSENSE_LINKED:
			const { adsenseLinked } = payload;
			return {
				...state,
				adsenseLinked,
			};
		default:
			return state;
	}
};

export const resolvers = {
	*getAdsenseLinked() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( select( MODULES_ANALYTICS ).getAdsenseLinked() !== undefined ) {
			return;
		}

		const { adsenseLinked } = yield {
			type: __ADSENSE_LINKED_GET_RESOLVED_SETTINGS,
		} || {};
		yield actions.setAdsenseLinked( adsenseLinked );
	},
};

export const selectors = {
	/**
	 * Gets the linked state of Analytics and Adsense services.
	 *
	 * @since 1.17.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} `true` if Analytics is linked with AdSense,
	 *                               `false` if not linked
	 *                               `undefined` if linked state is loading/unresolved.
	 */
	getAdsenseLinked( state ) {
		return state.adsenseLinked;
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
