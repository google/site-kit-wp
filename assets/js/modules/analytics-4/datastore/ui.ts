/**
 * `modules/analytics-4` data store: UI.
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

/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { createReducer } from 'googlesitekit-data';

interface UIState {
	/** ID of the active tab of the Content card, `undefined` until a tab is selected. */
	activeContentTab: string | undefined;
}

const SET_ACTIVE_CONTENT_TAB = 'SET_ACTIVE_CONTENT_TAB' as const;

type Action = {
	type: typeof SET_ACTIVE_CONTENT_TAB;
	payload: { tabID: string };
};

export const initialState: UIState = {
	activeContentTab: undefined,
};

export const actions = {
	/**
	 * Sets the active tab of the Content card.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} tabID ID of the tab to select.
	 * @return {Object} Redux-style action.
	 */
	setActiveContentTab( tabID: string ) {
		invariant(
			typeof tabID === 'string' && tabID.length > 0,
			'tabID must be a non-empty string.'
		);

		return {
			payload: { tabID },
			type: SET_ACTIVE_CONTENT_TAB,
		};
	},
};

export const controls = {};

export const reducer = createReducer( ( state: UIState, action: Action ) => {
	switch ( action.type ) {
		case SET_ACTIVE_CONTENT_TAB:
			state.activeContentTab = action.payload.tabID;
			break;

		default:
			break;
	}
} );

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the active tab of the Content card.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} ID of the active tab, or `undefined` until a tab is selected.
	 */
	getActiveContentTab( state: UIState ): string | undefined {
		return state.activeContentTab;
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
