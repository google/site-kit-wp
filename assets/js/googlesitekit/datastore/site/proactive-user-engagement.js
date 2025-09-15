/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createRegistrySelector,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { CORE_SITE } from './constants';

const { getRegistry } = commonActions;

const SET_PROACTIVE_USER_ENGAGEMENT_ENABLED =
	'SET_PROACTIVE_USER_ENGAGEMENT_ENABLED';

const settingsReducerCallback = createReducer( ( state, settings ) => {
	state.proactiveUserEngagementSettings = settings;
} );

const fetchGetProactiveUserEngagementSettingsStore = createFetchStore( {
	baseName: 'getProactiveUserEngagementSettings',
	controlCallback: () => {
		return get( 'core', 'site', 'proactive-user-engagement', null, {
			useCache: false,
		} );
	},
	reducerCallback: settingsReducerCallback,
} );

const fetchSaveProactiveUserEngagementSettingsStore = createFetchStore( {
	baseName: 'saveProactiveUserEngagementSettings',
	controlCallback: ( { settings } ) => {
		return set( 'core', 'site', 'proactive-user-engagement', { settings } );
	},
	reducerCallback: settingsReducerCallback,
	argsToParams: ( settings ) => {
		return { settings };
	},
	validateParams: ( { settings } ) => {
		invariant(
			isPlainObject( settings ),
			'settings must be a plain object.'
		);
	},
} );

const baseInitialState = {
	// Holds the Proactive User Engagement settings object, e.g. `{ enabled: boolean }` once loaded.
	proactiveUserEngagementSettings: undefined,
};

const baseActions = {
	/**
	 * Saves the Proactive User Engagement settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveProactiveUserEngagementSettings() {
		const { select } = yield getRegistry();
		const settings =
			select( CORE_SITE ).getProactiveUserEngagementSettings();

		return yield fetchSaveProactiveUserEngagementSettingsStore.actions.fetchSaveProactiveUserEngagementSettings(
			settings
		);
	},

	/**
	 * Sets the Proactive User Engagement enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} enabled PUE enabled status.
	 * @return {Object} Redux-style action.
	 */
	setProactiveUserEngagementEnabled( enabled ) {
		return {
			type: SET_PROACTIVE_USER_ENGAGEMENT_ENABLED,
			payload: { enabled },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_PROACTIVE_USER_ENGAGEMENT_ENABLED:
			state.proactiveUserEngagementSettings =
				state.proactiveUserEngagementSettings || {};
			state.proactiveUserEngagementSettings.enabled = !! payload.enabled;
			break;

		default:
			break;
	}
} );

const baseSelectors = {
	/**
	 * Gets the Proactive User Engagement settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} PUE settings, or `undefined` if not loaded.
	 */
	getProactiveUserEngagementSettings: ( state ) => {
		return state.proactiveUserEngagementSettings;
	},

	/**
	 * Gets the Proactive User Engagement enabled status.
	 *
	 * @since n.e.x.t
	 *
	 * @return {boolean|undefined} PUE enabled status, or `undefined` if not loaded.
	 */
	isProactiveUserEngagementEnabled: createRegistrySelector(
		( select ) => () => {
			const { enabled } =
				select( CORE_SITE ).getProactiveUserEngagementSettings() || {};

			return enabled;
		}
	),
};

const baseResolvers = {
	*getProactiveUserEngagementSettings() {
		const { select } = yield getRegistry();

		if ( select( CORE_SITE ).getProactiveUserEngagementSettings() ) {
			return;
		}

		yield fetchGetProactiveUserEngagementSettingsStore.actions.fetchGetProactiveUserEngagementSettings();
	},
};

const store = combineStores(
	fetchGetProactiveUserEngagementSettingsStore,
	fetchSaveProactiveUserEngagementSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
