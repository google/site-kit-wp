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
import { isPlainObject, isEqual } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	createReducer,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { CORE_USER, EMAIL_REPORT_FREQUENCIES } from './constants';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';

const baseInitialState = {
	proactiveUserEngagement: {
		settings: undefined,
		savedSettings: undefined,
		isSavingSettings: false,
	},
};

const fetchStoreReducerCallback = createReducer(
	( state, proactiveUserEngagementSettings ) => {
		state.proactiveUserEngagement.settings =
			proactiveUserEngagementSettings;
		state.proactiveUserEngagement.savedSettings =
			proactiveUserEngagementSettings;
	}
);

const fetchGetProactiveUserEngagementSettingsStore = createFetchStore( {
	baseName: 'getProactiveUserEngagementSettings',
	controlCallback: () =>
		get( 'core', 'user', 'proactive-user-engagement-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveProactiveUserEngagementSettingsStore = createFetchStore( {
	baseName: 'saveProactiveUserEngagementSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'user', 'proactive-user-engagement-settings', {
			settings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant(
			isPlainObject( settings ),
			'Proactive User Engagement settings should be an object.'
		);
		if ( settings.subscribed !== undefined ) {
			invariant(
				typeof settings.subscribed === 'boolean',
				'subscribed should be a boolean.'
			);
		}
		if ( settings.frequency !== undefined ) {
			invariant(
				typeof settings.frequency === 'string',
				'frequency should be a string.'
			);
			invariant(
				EMAIL_REPORT_FREQUENCIES.includes( settings.frequency ),
				`frequency should be one of: ${ EMAIL_REPORT_FREQUENCIES.join(
					', '
				) }`
			);
		}
	},
} );

// Actions
const SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS =
	'SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS';
const SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS_SAVING_FLAG =
	'SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS_SAVING_FLAG';
const RESET_PROACTIVE_USER_ENGAGEMENT_SETTINGS =
	'RESET_PROACTIVE_USER_ENGAGEMENT_SETTINGS';

const baseActions = {
	/**
	 * Sets proactive user engagement settings.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} settings Settings object.
	 * @return {Object} Redux-style action.
	 */
	setProactiveUserEngagementSettings( settings ) {
		return {
			type: SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS,
			payload: { settings },
		};
	},

	/**
	 * Sets the proactive user engagement frequency.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} frequency Frequency value.
	 * @return {Object} Redux-style action.
	 */
	setProactiveUserEngagementFrequency( frequency ) {
		invariant(
			EMAIL_REPORT_FREQUENCIES.includes( frequency ),
			`frequency should be one of: ${ EMAIL_REPORT_FREQUENCIES.join(
				', '
			) }`
		);

		return {
			type: SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS,
			payload: { settings: { frequency } },
		};
	},

	/**
	 * Saves the proactive user engagement settings.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} settings Optional. By default, this saves whatever there is in the store. Use this object to save additional settings.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveProactiveUserEngagementSettings: createValidatedAction(
		( settings = {} ) => {
			invariant(
				isPlainObject( settings ),
				'Proactive User Engagement settings should be an object to save.'
			);
		},
		function* ( settings = {} ) {
			const registry = yield commonActions.getRegistry();

			// Get current settings from state if no settings provided
			const currentSettings = registry
				.select( CORE_USER )
				.getProactiveUserEngagementSettings();

			const settingsToSave =
				Object.keys( settings ).length > 0 ? settings : currentSettings;

			yield {
				type: SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS_SAVING_FLAG,
				payload: { isSaving: true },
			};

			const { response, error } =
				yield fetchSaveProactiveUserEngagementSettingsStore.actions.fetchSaveProactiveUserEngagementSettings(
					settingsToSave
				);

			yield {
				type: SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS_SAVING_FLAG,
				payload: { isSaving: false },
			};

			return { response, error };
		}
	),

	/**
	 * Resets modified proactive user engagement settings to currently saved values.
	 *
	 * @since 1.162.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetProactiveUserEngagementSettings() {
		return {
			type: RESET_PROACTIVE_USER_ENGAGEMENT_SETTINGS,
			payload: {},
		};
	},
};

export const baseReducer = createReducer( ( state, action ) => {
	const { type, payload } = action;

	switch ( type ) {
		case SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS: {
			state.proactiveUserEngagement.settings = {
				...state.proactiveUserEngagement.settings,
				...payload.settings,
			};
			break;
		}

		case SET_PROACTIVE_USER_ENGAGEMENT_SETTINGS_SAVING_FLAG: {
			state.proactiveUserEngagement.isSavingSettings = payload.isSaving;
			break;
		}

		case RESET_PROACTIVE_USER_ENGAGEMENT_SETTINGS: {
			state.proactiveUserEngagement.settings =
				state.proactiveUserEngagement.savedSettings;
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getProactiveUserEngagementSettings() {
		const registry = yield commonActions.getRegistry();

		const proactiveUserEngagementSettings = registry
			.select( CORE_USER )
			.getProactiveUserEngagementSettings();

		if ( proactiveUserEngagementSettings === undefined ) {
			yield fetchGetProactiveUserEngagementSettingsStore.actions.fetchGetProactiveUserEngagementSettings();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the proactive user engagement settings.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Proactive User Engagement settings; `undefined` if not loaded.
	 */
	getProactiveUserEngagementSettings( state ) {
		return state.proactiveUserEngagement.settings;
	},

	/**
	 * Determines whether the user is subscribed to proactive user engagement.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the user is subscribed, otherwise FALSE.
	 */
	isProactiveUserEngagementSubscribed( state ) {
		const settings = state.proactiveUserEngagement.settings;
		return !! settings?.subscribed;
	},

	/**
	 * Determines whether the proactive user engagement settings have changed from what is saved.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the settings have changed, otherwise FALSE.
	 */
	haveProactiveUserEngagementSettingsChanged( state ) {
		const { settings, savedSettings } = state.proactiveUserEngagement;
		return ! isEqual( settings, savedSettings );
	},

	/**
	 * Determines whether the proactive user engagement settings are being saved or not.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the settings are being saved, otherwise FALSE.
	 */
	isSavingProactiveUserEngagementSettings( state ) {
		return !! state.proactiveUserEngagement.isSavingSettings;
	},

	/**
	 * Gets the proactive user engagement frequency.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} Frequency value.
	 */
	getProactiveUserEngagementFrequency( state ) {
		const settings = state?.proactiveUserEngagement?.settings;
		// If the settings haven't loaded at all, return `undefined` to signify
		// we're still loading this value.
		if ( settings === undefined ) {
			return undefined;
		}
		
		// Default to the first frequency option if settings have loaded
		// but the frequency is not set.
		return settings.frequency || EMAIL_REPORT_FREQUENCIES[ 0 ];
	},

	/**
	 * Gets the previously-saved frequency.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Saved frequency or undefined.
	 */
	getProactiveUserEngagementSavedFrequency( state ) {
		return state?.proactiveUserEngagement?.savedSettings?.frequency;
	},
};

const store = combineStores(
	fetchGetProactiveUserEngagementSettingsStore,
	fetchSaveProactiveUserEngagementSettingsStore,
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
