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
import { isEqual, isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_USER, EMAIL_REPORT_FREQUENCIES } from './constants';

const baseInitialState = {
	emailReporting: {
		settings: undefined,
		savedSettings: undefined,
		isSavingSettings: false,
	},
	emailReportingNextReport: {
		timestamp: undefined,
	},
};

const fetchStoreReducerCallback = createReducer(
	( state, emailReportingSettings ) => {
		state.emailReporting.settings = emailReportingSettings;
		state.emailReporting.savedSettings = emailReportingSettings;
	}
);

const fetchGetEmailReportingNextReportStore = createFetchStore( {
	baseName: 'getEmailReportingNextReport',
	controlCallback: () =>
		get( 'core', 'user', 'email-reporting-next-report', undefined, {
			// Always fetch fresh data instead of relying on a cached value,
			// since the next report timestamp depends on the current time
			// and can go stale quickly.
			useCache: false,
		} ),
	reducerCallback: createReducer( ( state, { timestamp } ) => {
		state.emailReportingNextReport.timestamp = timestamp;
	} ),
} );

const fetchGetEmailReportingSettingsStore = createFetchStore( {
	baseName: 'getEmailReportingSettings',
	controlCallback: () =>
		get( 'core', 'user', 'email-reporting-settings', undefined, {
			useCache: false,
		} ),
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveEmailReportingSettingsStore = createFetchStore( {
	baseName: 'saveEmailReportingSettings',
	controlCallback: ( settings ) =>
		set( 'core', 'user', 'email-reporting-settings', {
			settings,
		} ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( settings ) => settings,
	validateParams: ( settings ) => {
		invariant(
			isPlainObject( settings ),
			'Email Reporting settings should be an object.'
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
	isAction: true,
} );

// Actions
const SET_EMAIL_REPORTING_SETTINGS = 'SET_EMAIL_REPORTING_SETTINGS';
const SET_EMAIL_REPORTING_SETTINGS_SAVING_FLAG =
	'SET_EMAIL_REPORTING_SETTINGS_SAVING_FLAG';
const RESET_EMAIL_REPORTING_SETTINGS = 'RESET_EMAIL_REPORTING_SETTINGS';

const baseActions = {
	/**
	 * Re-fetches the next report timestamp from the server.
	 *
	 * Should be called whenever the saved email reporting frequency changes
	 * (e.g. after saving settings), since the previously fetched timestamp
	 * would otherwise remain stale for the lifetime of the page.
	 *
	 * Deliberately leaves the previous timestamp in place until the fresh
	 * one arrives (rather than clearing it first) so the displayed date
	 * doesn't flash away and back while refetching.
	 *
	 * @since 1.186.0
	 */
	*invalidateEmailReportingNextReport() {
		const registry = yield commonActions.getRegistry();

		registry
			.dispatch( CORE_USER )
			.invalidateResolutionForStoreSelector(
				'getEmailReportingNextReportTimestamp'
			);

		yield fetchGetEmailReportingNextReportStore.actions.fetchGetEmailReportingNextReport();
	},

	/**
	 * Sets email reporting settings.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} settings Settings object.
	 * @return {Object} Redux-style action.
	 */
	setEmailReportingSettings( settings ) {
		return {
			type: SET_EMAIL_REPORTING_SETTINGS,
			payload: { settings },
		};
	},

	/**
	 * Sets the email reporting frequency.
	 *
	 * @since 1.164.0
	 *
	 * @param {string} frequency Frequency value.
	 * @return {Object} Redux-style action.
	 */
	setEmailReportingFrequency( frequency ) {
		invariant(
			EMAIL_REPORT_FREQUENCIES.includes( frequency ),
			`frequency should be one of: ${ EMAIL_REPORT_FREQUENCIES.join(
				', '
			) }`
		);

		return {
			type: SET_EMAIL_REPORTING_SETTINGS,
			payload: { settings: { frequency } },
		};
	},

	/**
	 * Saves the email reporting settings.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} settings Optional. By default, this saves whatever there is in the store. Use this object to save additional settings.
	 * @return {Object} Object with `response` and `error`.
	 */
	saveEmailReportingSettings: createValidatedAction(
		( settings = {} ) => {
			invariant(
				isPlainObject( settings ),
				'Email Reporting settings should be an object to save.'
			);
		},
		function* ( settings = {} ) {
			const registry = yield commonActions.getRegistry();

			// Get current settings from state if no settings provided
			const currentSettings = registry
				.select( CORE_USER )
				.getEmailReportingSettings();
			const defaultSettings = currentSettings || {};

			const settingsToSave =
				Object.keys( settings ).length > 0
					? { ...defaultSettings, ...settings }
					: currentSettings;

			// Captured before saving, since a successful save immediately
			// updates the saved frequency to the new value.
			const previousFrequency = registry
				.select( CORE_USER )
				.getEmailReportingSavedFrequency();

			yield {
				type: SET_EMAIL_REPORTING_SETTINGS_SAVING_FLAG,
				payload: { isSaving: true },
			};

			const { response, error } =
				yield fetchSaveEmailReportingSettingsStore.actions.fetchSaveEmailReportingSettings(
					settingsToSave
				);

			yield {
				type: SET_EMAIL_REPORTING_SETTINGS_SAVING_FLAG,
				payload: { isSaving: false },
			};

			// Only the frequency affects the next report timestamp, so only
			// invalidate the cached value (forcing a fresh fetch) when the
			// frequency has actually changed; otherwise the cached value is
			// still accurate and a refetch would be wasted.
			if ( ! error && settingsToSave.frequency !== previousFrequency ) {
				registry
					.dispatch( CORE_USER )
					.invalidateEmailReportingNextReport();
			}

			return { response, error };
		}
	),

	/**
	 * Resets modified email reporting settings to currently saved values.
	 *
	 * @since 1.162.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetEmailReportingSettings() {
		return {
			type: RESET_EMAIL_REPORTING_SETTINGS,
			payload: {},
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

		case SET_EMAIL_REPORTING_SETTINGS_SAVING_FLAG: {
			state.emailReporting.isSavingSettings = payload.isSaving;
			break;
		}

		case RESET_EMAIL_REPORTING_SETTINGS: {
			state.emailReporting.settings = state.emailReporting.savedSettings;
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
			.select( CORE_USER )
			.getEmailReportingSettings();

		if ( emailReportingSettings === undefined ) {
			yield fetchGetEmailReportingSettingsStore.actions.fetchGetEmailReportingSettings();
		}
	},

	*getEmailReportingNextReportTimestamp() {
		const registry = yield commonActions.getRegistry();

		const timestamp = registry
			.select( CORE_USER )
			.getEmailReportingNextReportTimestamp();

		if ( timestamp === undefined ) {
			yield fetchGetEmailReportingNextReportStore.actions.fetchGetEmailReportingNextReport();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the email reporting settings.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Email Reporting settings; `undefined` if not loaded.
	 */
	getEmailReportingSettings( state ) {
		return state.emailReporting.settings;
	},

	/**
	 * Determines whether the user is subscribed to email reporting.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the user is subscribed, otherwise FALSE.
	 */
	isEmailReportingSubscribed( state ) {
		const settings = state.emailReporting.settings;
		return !! settings?.subscribed;
	},

	/**
	 * Determines whether the email reporting settings have changed from what is saved.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the settings have changed, otherwise FALSE.
	 */
	haveEmailReportingSettingsChanged( state ) {
		const { settings, savedSettings } = state.emailReporting;
		return ! isEqual( settings, savedSettings );
	},

	/**
	 * Determines whether the email reporting settings are being saved or not.
	 *
	 * @since 1.162.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the settings are being saved, otherwise FALSE.
	 */
	isSavingEmailReportingSettings( state ) {
		return !! state.emailReporting.isSavingSettings;
	},

	/**
	 * Gets the email reporting frequency.
	 *
	 * @since 1.164.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} Frequency value.
	 */
	getEmailReportingFrequency( state ) {
		const settings = state?.emailReporting?.settings;
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
	 * @since 1.164.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Saved frequency or undefined.
	 */
	getEmailReportingSavedFrequency( state ) {
		return state?.emailReporting?.savedSettings?.frequency;
	},

	/**
	 * Gets the next scheduled email report timestamp for the user's saved frequency.
	 *
	 * @since 1.186.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|undefined)} Unix timestamp (in seconds) of the next scheduled report; `undefined` if not loaded.
	 */
	getEmailReportingNextReportTimestamp( state ) {
		return state.emailReportingNextReport.timestamp;
	},
};

const store = combineStores(
	fetchGetEmailReportingNextReportStore,
	fetchGetEmailReportingSettingsStore,
	fetchSaveEmailReportingSettingsStore,
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
