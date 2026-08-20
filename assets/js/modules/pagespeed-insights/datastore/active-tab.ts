/**
 * `modules/pagespeed-insights` data store: active tab.
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
import { STRATEGY_DESKTOP, STRATEGY_MOBILE } from './constants';

export type ActiveTab = typeof STRATEGY_MOBILE | typeof STRATEGY_DESKTOP;

interface ActiveTabState {
	/** Active device tab shown by the PageSpeed Insights widget. */
	activeTab: ActiveTab;
}

const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB' as const;

type Action = {
	type: typeof SET_ACTIVE_TAB;
	payload: { activeTab: ActiveTab };
};

export const initialState: ActiveTabState = {
	activeTab: STRATEGY_MOBILE,
};

export const actions = {
	/**
	 * Sets the active device tab for the PageSpeed Insights widget.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} activeTab Device tab to activate: `STRATEGY_MOBILE` or `STRATEGY_DESKTOP`.
	 * @return {Object} Redux-style action.
	 */
	setActiveTab( activeTab: ActiveTab ) {
		invariant(
			[ STRATEGY_MOBILE, STRATEGY_DESKTOP ].includes( activeTab ),
			`activeTab must be one of: ${ STRATEGY_MOBILE }, ${ STRATEGY_DESKTOP }.`
		);

		return {
			payload: { activeTab },
			type: SET_ACTIVE_TAB,
		};
	},
};

export const controls = {};

export const reducer = createReducer(
	( state: ActiveTabState, action: Action ) => {
		switch ( action.type ) {
			case SET_ACTIVE_TAB:
				state.activeTab = action.payload.activeTab;
				break;

			default:
				break;
		}
	}
);

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the active device tab for the PageSpeed Insights widget.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} Active device tab: `STRATEGY_MOBILE` or `STRATEGY_DESKTOP`.
	 */
	getActiveTab( state: ActiveTabState ): ActiveTab {
		return state.activeTab;
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
