/**
 * `core/site` data store: Email Reporting settings.
 *
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
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';

const baseInitialState = {
	emailReporting: {
		settings: undefined,
		savedSettings: undefined,
	},
};

const fetchStoreReducerCallback = createReducer(
	( state, emailReportingSettings ) => {
		state.emailReporting.settings = emailReportingSettings;
		state.emailReporting.savedSettings = emailReportingSettings;
	}
);

const fetchGetEmailReportingSettingsStore = createFetchStore( {
	baseName: 'getEmailReportingSettings',
	controlCallback: () =>
		get( 'core', 'site', 'email-reporting', undefined, {
			useCache: false,
		} ),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveEmailReportingSettingsStore = createFetchStore( {
	baseName: 'saveEmailReportingSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'site', 'email-reporting', {
			settings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant(
			isPlainObject( settings ),
			'Email Reporting settings should be an object.'
		);
		invariant(
			typeof settings.enabled === 'boolean',
			'enabled should be a boolean.'
		);
	},
} );

const fetchGetWasAnalytics4Connected = createFetchStore( {
	baseName: 'getWasAnalytics4Connected',
	controlCallback: () => {
		return get( 'core', 'site', 'was-analytics-4-connected', undefined );
	},
	reducerCallback: createReducer( ( state, wasAnalytics4Connected ) => {
		state.emailReporting.wasAnalytics4Connected = wasAnalytics4Connected;
	} ),
} );

// Actions
const SET_EMAIL_REPORTING_SETTINGS = 'SET_EMAIL_REPORTING_SETTINGS';

const baseActions = {
	/**
	 * Saves the email reporting settings.
	 *
	 * @since 1.165.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveEmailReportingSettings() {
		const { select } = yield commonActions.getRegistry();
		const settings = select( CORE_SITE ).getEmailReportingSettings();

		const results =
			yield fetchSaveEmailReportingSettingsStore.actions.fetchSaveEmailReportingSettings(
				settings
			);

		return results;
	},

	/**
	 * Sets email reporting enabled state.
	 *
	 * @since 1.165.0
	 *
	 * @param {*} enabled Whether email reporting is enabled.
	 * @return {Object} Redux-style action.
	 */
	setEmailReportingEnabled( enabled ) {
		invariant(
			typeof enabled === 'boolean',
			'enabled should be a boolean.'
		);

		return {
			type: SET_EMAIL_REPORTING_SETTINGS,
			payload: { settings: { enabled } },
		};
	},
};

export const baseReducer = createReducer( ( state, action ) => {
	const { type, payload } = action;

	switch ( type ) {
		case SET_EMAIL_REPORTING_SETTINGS: {
			state.emailReporting.settings = {
				...state.emailReporting.settings,
				...payload.settings,
			};
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getEmailReportingSettings() {
		const registry = yield commonActions.getRegistry();

		const emailReportingSettings = registry
			.select( CORE_SITE )
			.getEmailReportingSettings();

		if ( emailReportingSettings === undefined ) {
			yield fetchGetEmailReportingSettingsStore.actions.fetchGetEmailReportingSettings();
		}
	},
	*getWasAnalytics4Connected() {
		const registry = yield commonActions.getRegistry();

		const wasAnalytics4Connected = registry
			.select( CORE_SITE )
			.getWasAnalytics4Connected();

		if ( wasAnalytics4Connected === undefined ) {
			yield fetchGetWasAnalytics4Connected.actions.fetchGetWasAnalytics4Connected();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the email reporting settings.
	 *
	 * @since 1.165.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Email Reporting settings; `undefined` if not loaded.
	 */
	getEmailReportingSettings( state ) {
		return state.emailReporting?.settings;
	},

	/**
	 * Determines whether email reporting is enabled.
	 *
	 * @since 1.165.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if email reporting is enabled, otherwise FALSE.
	 */
	isEmailReportingEnabled( state ) {
		const settings = state.emailReporting?.settings;
		return !! settings?.enabled;
	},

	/**
	 * Gets whether Analytics 4 was ever connected.
	 *
	 * @since 1.165.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} TRUE if Analytics 4 was connected, FALSE if not, or `undefined` if not loaded yet.
	 */
	getWasAnalytics4Connected( state ) {
		return state.emailReporting?.wasAnalytics4Connected;
	},
};

const store = combineStores(
	fetchGetEmailReportingSettingsStore,
	fetchSaveEmailReportingSettingsStore,
	fetchGetWasAnalytics4Connected,
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
