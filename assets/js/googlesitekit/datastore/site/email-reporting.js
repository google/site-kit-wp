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
	createRegistrySelector,
} from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';

const baseInitialState = {
	emailReporting: {
		settings: undefined,
		savedSettings: undefined,
		eligibleSubscribers: undefined,
		errors: undefined,
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

const fetchGetEligibleSubscribersStore = createFetchStore( {
	baseName: 'getEligibleSubscribers',
	controlCallback: () =>
		get( 'core', 'site', 'email-reporting-eligible-subscribers' ),
	reducerCallback: createReducer( ( state, eligibleSubscribers ) => {
		state.emailReporting.eligibleSubscribers = eligibleSubscribers;
	} ),
} );

const fetchGetEmailReportingErrorsStore = createFetchStore( {
	baseName: 'getEmailReportingErrors',
	controlCallback: () =>
		get( 'core', 'site', 'email-reporting-errors', undefined, {
			useCache: false,
		} ),
	reducerCallback: ( state, errors ) => {
		state.emailReporting.errors = errors || {};
	},
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
	*getEligibleSubscribers() {
		const registry = yield commonActions.getRegistry();

		const eligibleSubscribers = registry
			.select( CORE_SITE )
			.getEligibleSubscribers();

		if ( eligibleSubscribers === undefined ) {
			yield fetchGetEligibleSubscribersStore.actions.fetchGetEligibleSubscribers();
		}
	},
	*getEmailReportingErrors() {
		const registry = yield commonActions.getRegistry();

		const errors = registry.select( CORE_SITE ).getEmailReportingErrors();

		if ( errors === undefined ) {
			yield fetchGetEmailReportingErrorsStore.actions.fetchGetEmailReportingErrors();
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
	 * @return {boolean} TRUE if email reporting is enabled, otherwise FALSE; `undefined` if not loaded.
	 */
	isEmailReportingEnabled: createRegistrySelector( ( select ) => () => {
		const { enabled } =
			select( CORE_SITE ).getEmailReportingSettings() || {};

		return enabled;
	} ),

	/**
	 * Gets eligible subscribers for email report invitations.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Eligible subscribers list; `undefined` if not loaded.
	 */
	getEligibleSubscribers: createRegistrySelector( ( select ) => ( state ) => {
		const eligibleSubscribers = state.emailReporting?.eligibleSubscribers;
		const currentUserID = select( CORE_USER ).getID();

		if (
			eligibleSubscribers === undefined ||
			currentUserID === undefined
		) {
			return undefined;
		}

		if ( ! Array.isArray( eligibleSubscribers ) ) {
			return [];
		}

		return eligibleSubscribers
			.filter( ( user ) => user.id !== currentUserID )
			.map( ( user ) => ( {
				id: user.id,
				name: user.displayName || user.name,
				email: user.email,
				role: user.role,
				subscribed: user.subscribed,
			} ) );
	} ),

	/**
	 * Gets the email reporting errors.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Email Reporting errors; `undefined` if not loaded.
	 */
	getEmailReportingErrors( state ) {
		return state.emailReporting?.errors;
	},

	/**
	 * Gets the category ID of the latest email reporting error.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Category ID of the latest email reporting error; `undefined` if not loaded; null if no errors or category ID is not present for the latest error.
	 */
	getLatestEmailReportingErrorCategoryID: createRegistrySelector(
		( select ) => () => {
			const { errors, error_data: errorData } =
				select( CORE_SITE ).getEmailReportingErrors() || {};

			if ( errors === undefined ) {
				return undefined;
			}

			return errorData[ Object.keys( errors )[ 0 ] ]?.category_id;
		}
	),
};

const store = combineStores(
	fetchGetEmailReportingSettingsStore,
	fetchSaveEmailReportingSettingsStore,
	fetchGetEligibleSubscribersStore,
	fetchGetEmailReportingErrorsStore,
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
