/**
 * `modules/analytics-4` data store: audience settings.
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
// import invariant from 'invariant';
// import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
// import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { createReducer } from '../../../googlesitekit/data/create-reducer';
// import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

// const { receiveError, clearError } = errorStoreActions;

const fetchStoreReducerCallback = createReducer(
	( state, audienceSettings ) => {
		if ( ! state.audienceSettings ) {
			state.audienceSettings = {};
		}

		state.audienceSettings.settings = audienceSettings;
		state.audienceSettings.savedSettings = audienceSettings;
	}
);

const fetchGetAudienceSettingsStore = createFetchStore( {
	baseName: 'getAudienceSettings',
	controlCallback() {
		return API.get(
			'modules',
			'analytics-4',
			'audience-settings',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback: fetchStoreReducerCallback,
} );

const baseInitialState = {
	audienceSettings: undefined,
};

const baseActions = {};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAudienceSettings() {
		const registry = yield Data.commonActions.getRegistry();

		const audienceSettings = registry
			.select( MODULES_ANALYTICS_4 )
			.getAudienceSettings();

		if ( audienceSettings === undefined ) {
			yield fetchGetAudienceSettingsStore.actions.fetchGetAudienceSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the audience settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Audience settings; `undefined` if not loaded.
	 */
	getAudienceSettings( state ) {
		return state.audienceSettings;
	},
};

const store = Data.combineStores( fetchGetAudienceSettingsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
