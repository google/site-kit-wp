/**
 * `core/user` data store: initial setup settings.
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
	createReducer,
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';

// Actions
const SET_IS_ANALYTICS_SETUP_COMPLETE = 'SET_IS_ANALYTICS_SETUP_COMPLETE';

const baseInitialState = {
	initialSetupSettings: undefined,
};

const fetchStoreReducerCallback = createReducer(
	( state, initialSetupSettings ) => {
		state.initialSetupSettings = initialSetupSettings;
	}
);

const fetchGetInitialSetupSettingsStore = createFetchStore( {
	baseName: 'getInitialSetupSettings',
	controlCallback: () =>
		get( 'core', 'user', 'initial-setup-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveInitialSetupSettingsStore = createFetchStore( {
	baseName: 'saveInitialSetupSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'user', 'initial-setup-settings', {
			settings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant(
			isPlainObject( settings ),
			'Initial setup settings should be an object.'
		);
		if ( settings.isAnalyticsSetupComplete !== undefined ) {
			invariant(
				typeof settings.isAnalyticsSetupComplete === 'boolean',
				'isAnalyticsSetupComplete should be a boolean.'
			);
		}
	},
} );

const baseActions = {
	/**
	 * Saves the initial setup settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} settings Optional. By default, this saves whatever there is in the store. Use this object to save additional settings.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveInitialSetupSettings: createValidatedAction(
		( settings = {} ) => {
			invariant(
				isPlainObject( settings ),
				'Initial setup settings should be an object to save.'
			);
		},
		function* ( settings = {} ) {
			const registry = yield commonActions.getRegistry();
			const initialSetupSettings = yield commonActions.await(
				registry.resolveSelect( CORE_USER ).getInitialSetupSettings()
			);

			const finalSettings = {
				...initialSetupSettings,
				...settings,
			};

			return yield fetchSaveInitialSetupSettingsStore.actions.fetchSaveInitialSetupSettings(
				finalSettings
			);
		}
	),

	/* eslint-disable sitekit/jsdoc-no-unnamed-boolean-params */
	/**
	 * Sets whether Analytics setup is complete.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} isAnalyticsSetupComplete Whether or not the Analytics setup is complete.
	 * @return {Object} Redux-style action.
	 */
	setIsAnalyticsSetupComplete( isAnalyticsSetupComplete ) {
		invariant(
			typeof isAnalyticsSetupComplete === 'boolean',
			'Analytics setup completeness should be a boolean.'
		);

		return {
			type: SET_IS_ANALYTICS_SETUP_COMPLETE,
			payload: { isAnalyticsSetupComplete },
		};
	},
};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_IS_ANALYTICS_SETUP_COMPLETE: {
			const { isAnalyticsSetupComplete } = payload;

			state.initialSetupSettings = {
				...state.initialSetupSettings,
				isAnalyticsSetupComplete,
			};

			break;
		}

		default: {
			break;
		}
	}
} );

const baseResolvers = {
	*getInitialSetupSettings() {
		const registry = yield commonActions.getRegistry();

		const initialSetupSettings = registry
			.select( CORE_USER )
			.getInitialSetupSettings();

		if ( initialSetupSettings === undefined ) {
			yield fetchGetInitialSetupSettingsStore.actions.fetchGetInitialSetupSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Returns the initial setup settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Initial setup settings.
	 */
	getInitialSetupSettings( state ) {
		return state.initialSetupSettings;
	},

	/**
	 * Returns whether Analytics setup is complete from the initial setup settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|null|undefined)} Whether the Analytics setup is complete or not; `undefined` if not loaded or `null` if not set yet.
	 */
	isAnalyticsSetupComplete: createRegistrySelector( ( select ) => () => {
		const initialSetupSettings =
			select( CORE_USER ).getInitialSetupSettings();

		return initialSetupSettings?.isAnalyticsSetupComplete;
	} ),
};

const store = combineStores(
	fetchGetInitialSetupSettingsStore,
	fetchSaveInitialSetupSettingsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
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
