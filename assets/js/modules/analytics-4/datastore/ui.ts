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
	activeContentTab: string | undefined;
}

const SET_ACTIVE_CONTENT_TAB = 'SET_ACTIVE_CONTENT_TAB' as const;

type Action = {
	type: typeof SET_ACTIVE_CONTENT_TAB;
	payload: { tabID: string };
};

const baseInitialState: UIState = {
	activeContentTab: undefined,
};

const baseActions = {
	/**
	 * Sets the active tab of the Content card.
	 *
	 * @since n.e.x.t
	 *
	 * @param tabID The ID of the tab to select.
	 * @return Redux-style action.
	 */
	setActiveContentTab( tabID: string ) {
		invariant(
			typeof tabID === 'string' && tabID.length > 0,
			'tabID must be a non-empty string.'
		);

		return {
			type: SET_ACTIVE_CONTENT_TAB,
			payload: { tabID },
		};
	},
};

const baseReducer = createReducer(
	( state: UIState, { type, payload }: Action ) => {
		switch ( type ) {
			case SET_ACTIVE_CONTENT_TAB:
				state.activeContentTab = payload.tabID;
				break;

			default:
				break;
		}
	}
);

const baseSelectors = {
	/**
	 * Gets the active tab of the Content card.
	 *
	 * @since n.e.x.t
	 *
	 * @param state Data store's state.
	 * @return The ID of the active tab, or `undefined` when no tab has been selected yet.
	 */
	getActiveContentTab( state: UIState ): string | undefined {
		return state.activeContentTab;
	},
};

const store = {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	selectors: baseSelectors,
};

export const initialState = store.initialState;
export const actions = store.actions;
export const reducer = store.reducer;
export const selectors = store.selectors;

export default store;
