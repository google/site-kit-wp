/**
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

import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../data/create-fetch-store';
import { createReducer } from '../../data/create-reducer';
import { CORE_SITE } from './constants';
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

const { getRegistry } = Data.commonActions;

const SET_CONSENT_MODE_ENABLED = 'SET_CONSENT_MODE_ENABLED';
const SET_CONSENT_MODE_REGIONS = 'SET_CONSENT_MODE_REGIONS';

const fetchGetConsentModeSettingsStore = createFetchStore( {
	baseName: 'getConsentModeSettings',
	controlCallback: () =>
		API.get( 'core', 'site', 'consent-mode', null, { useCache: false } ),
	reducerCallback: ( state, response ) => {
		return {
			...state,
			consentMode: { ...response },
		};
	},
} );

const fetchSaveConsentModeSettingsStore = createFetchStore( {
	baseName: 'saveConsentModeSettings',
	controlCallback: ( { settings } ) =>
		API.set( 'core', 'site', 'consent-mode', { settings } ),
	reducerCallback: ( state, response ) => {
		return {
			...state,
			consentMode: { ...response },
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
	consentMode: undefined,
};

const baseActions = {
	*saveConsentModeSettings() {
		const { select } = yield getRegistry();
		const settings = select( CORE_SITE ).getConsentModeSettings();

		yield fetchSaveConsentModeSettingsStore.actions.fetchSaveConsentModeSettings(
			settings
		);
	},

	setConsentModeEnabled( enabled ) {
		return {
			type: SET_CONSENT_MODE_ENABLED,
			payload: { enabled },
		};
	},

	setConsentModeRegions( regions ) {
		return {
			type: SET_CONSENT_MODE_REGIONS,
			payload: { regions },
		};
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, action ) => {
	switch ( action.type ) {
		case SET_CONSENT_MODE_ENABLED:
			state.consentMode.enabled = !! action.payload.enabled;
			break;

		case SET_CONSENT_MODE_REGIONS:
			state.consentMode.regions = action.payload.regions;
			break;
	}
} );

const baseSelectors = {
	getConsentModeSettings: ( state ) => {
		return state.consentMode;
	},
};

const baseResolvers = {
	*getConsentModeSettings() {
		const { select } = yield getRegistry();

		if ( select( CORE_SITE ).getConsentModeSettings() ) {
			return;
		}

		yield fetchGetConsentModeSettingsStore.actions.fetchGetConsentModeSettings();
	},
};

const store = Data.combineStores(
	fetchGetConsentModeSettingsStore,
	fetchSaveConsentModeSettingsStore,
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
