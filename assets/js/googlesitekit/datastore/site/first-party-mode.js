/**
 * `core/site` data store: first-party-mode.
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
import { isPlainObject } from 'lodash';
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	commonActions,
	createRegistrySelector,
	combineStores,
} from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const SET_FIRST_PARTY_MODE_ENABLED = 'SET_FIRST_PARTY_MODE_ENABLED';

const fetchGetFirstPartyModeSettings = createFetchStore( {
	baseName: 'getFirstPartyModeSettings',
	controlCallback: () =>
		API.get( 'core', 'site', 'fpm-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: ( state, firstPartyModeSettings ) => {
		return {
			...state,
			firstPartyModeSettings: {
				...( state.firstPartyModeSettings || {} ),
				...firstPartyModeSettings,
			},
		};
	},
} );

const fetchSaveFirstPartyModeSettings = createFetchStore( {
	baseName: 'saveFirstPartyModeSettings',
	controlCallback: ( { settings } ) => {
		return API.set( 'core', 'site', 'fpm-settings', { settings } );
	},
	reducerCallback: ( state, firstPartyModeSettings ) => {
		return {
			...state,
			firstPartyModeSettings: {
				...( state.firstPartyModeSettings || {} ),
				...firstPartyModeSettings,
			},
		};
	},
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
	firstPartyModeSettings: undefined,
};

const baseActions = {
	setFirstPartyModeEnabled() {
		return {
			type: SET_FIRST_PARTY_MODE_ENABLED,
		};
	},
};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case SET_FIRST_PARTY_MODE_ENABLED: {
			return {
				...state,
				firstPartyModeSettings: {
					...( state.firstPartyModeSettings || {} ),
					enabled: true,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getFirstPartyModeSettings() {
		const { select } = yield commonActions.getRegistry();

		const settings = select( CORE_SITE ).getFirstPartyModeSettings();
		if ( settings === undefined ) {
			yield fetchGetFirstPartyModeSettings.actions.fetchGetFirstPartyModeSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the first-party mode settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} First-party mode settings, or `undefined` if not loaded.
	 */
	getFirstPartyModeSettings: ( state ) => {
		return state.firstPartyModeSettings;
	},

	/**
	 * Checks if first-party mode is enabled.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if first-party mode is enabled, otherwise false.
	 */
	isFirstPartyModeEnabled: createRegistrySelector( ( select ) => () => {
		const { firstPartyModeSettings } =
			select( CORE_SITE ).getFirstPartyModeSettings();
		return !! firstPartyModeSettings?.enabled;
	} ),

	isFPMHealthy: createRegistrySelector( ( select ) => () => {
		const { firstPartyModeSettings } =
			select( CORE_SITE ).getFirstPartyModeSettings();
		return !! firstPartyModeSettings?.healthy;
	} ),

	isScriptAccessEnabled: createRegistrySelector( ( select ) => () => {
		const { firstPartyModeSettings } =
			select( CORE_SITE ).getFirstPartyModeSettings();
		return !! firstPartyModeSettings?.scriptAccess;
	} ),
};

const store = combineStores(
	fetchGetFirstPartyModeSettings,
	fetchSaveFirstPartyModeSettings,
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
