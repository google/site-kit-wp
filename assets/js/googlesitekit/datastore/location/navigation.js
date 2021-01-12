/**
 * `core/location` data store: navigation data
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
import delay from 'lodash/delay';
import invariant from 'invariant';

const DO_NAVIGATE_TO = 'DO_NAVIGATE_TO';
const SET_NAVIGATING_TO = 'SET_NAVIGATING_TO';

export const initialState = {
	navigatingTo: undefined,
};

export const actions = {

	/**
	 * Sets navigating URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} url The navigation URL.
	 * @return {Object} Redux-style action.
	 */
	*navigateTo( url ) {
		const payload = { url };
		let isValidURL = false;

		try {
			isValidURL = new URL( url );
		} catch {
		}

		invariant( !! isValidURL, 'url must be a valid URI.' );

		yield {
			type: SET_NAVIGATING_TO,
			payload,
		};

		return yield {
			type: DO_NAVIGATE_TO,
			payload,
		};
	},

};

export const controls = {
	[ DO_NAVIGATE_TO ]: ( { payload } ) => {
		delay( () => global.location.assign( payload.url ), 500, 'later' );
	},
};

export function reducer( state, { type, payload } ) {
	switch ( type ) {
		case SET_NAVIGATING_TO: {
			return {
				...state,
				navigatingTo: payload.url,
			};
		}
		default: {
			return state;
		}
	}
}

export const resolvers = {};

export const selectors = {

	/**
	 * Determines whether the navigation is happening or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if navigating, otherwise FALSE.
	 */
	isNavigating( state ) {
		return !! state.navigatingTo;
	},

	/**
	 * Gets navigation URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {string|null} The current navigating URL if doing navigation, otherwise NULL.
	 */
	getNavigateURL( state ) {
		return state.navigatingTo || null;
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
