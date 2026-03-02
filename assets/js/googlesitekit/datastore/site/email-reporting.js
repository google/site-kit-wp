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
import { createValidatedAction } from '@/js/googlesitekit/data/utils';

const START_INVITING_USER = 'START_INVITING_USER';
const FINISH_INVITING_USER = 'FINISH_INVITING_USER';

const baseInitialState = {
	emailReporting: {
		settings: undefined,
		savedSettings: undefined,
		eligibleSubscribers: undefined,
		errors: undefined,
		invitingUsers: {},
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
		get(
			'core',
			'site',
			'email-reporting-eligible-subscribers',
			undefined,
			{
				useCache: false,
			}
		),
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

const fetchInviteUserStore = createFetchStore( {
	baseName: 'inviteUser',
	controlCallback: ( { userID } ) =>
		set( 'core', 'site', 'email-reporting-invite-user', {
			userID,
		} ),
	// Mark invited subscriber in local state to persist invited
	// state on panel re-open. The transient handles persistent
	// state for 24 hours on app refresh.
	reducerCallback: createReducer( ( state, response, { userID } ) => {
		const subscribers = state.emailReporting.eligibleSubscribers;
		if ( Array.isArray( subscribers ) ) {
			const user = subscribers.find(
				( potentialNewlyInvitedUser ) =>
					potentialNewlyInvitedUser.id === userID
			);
			if ( user ) {
				user.invited = true;
			}
		}
	} ),
	argsToParams: ( userID ) => ( { userID } ),
	validateParams: ( { userID } = {} ) => {
		invariant(
			Number.isInteger( userID ) && userID > 0,
			'userID should be a positive integer.'
		);
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
	 * Sends an invitation to an eligible subscriber.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID Eligible user ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	inviteUser: createValidatedAction(
		( userID ) => {
			invariant(
				Number.isInteger( userID ) && userID > 0,
				'userID should be a positive integer.'
			);
		},
		function* ( userID ) {
			const registry = yield commonActions.getRegistry();

			registry.dispatch( CORE_SITE ).startInvitingUser( userID );

			try {
				const result =
					yield fetchInviteUserStore.actions.fetchInviteUser(
						userID
					);

				return result;
			} finally {
				registry.dispatch( CORE_SITE ).finishInvitingUser( userID );
			}
		}
	),

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

	/**
	 * Sets the inviting state to true for a user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID User ID.
	 * @return {Object} Redux-style action.
	 */
	startInvitingUser( userID ) {
		return {
			type: START_INVITING_USER,
			payload: { userID },
		};
	},

	/**
	 * Clears the inviting state for a user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID User ID.
	 * @return {Object} Redux-style action.
	 */
	finishInvitingUser( userID ) {
		return {
			type: FINISH_INVITING_USER,
			payload: { userID },
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
		case START_INVITING_USER: {
			state.emailReporting.invitingUsers[ payload.userID ] = true;
			break;
		}
		case FINISH_INVITING_USER: {
			state.emailReporting.invitingUsers[ payload.userID ] = false;
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
	 * @since 1.172.0
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
				invited: user.invited,
			} ) );
	} ),

	/**
	 * Gets the email reporting errors.
	 *
	 * @since 1.172.0
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
	 * @since 1.172.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} Category ID of the latest email reporting error; `undefined` if not loaded; null if no errors or category ID is not present for the latest error.
	 */
	getLatestEmailReportingErrorCategoryID: createRegistrySelector(
		( select ) => () => {
			const { errors, error_data: errorData } =
				select( CORE_SITE ).getEmailReportingErrors() || {};

			if ( errors === undefined ) {
				return undefined;
			}

			const categoryID =
				errorData?.[ Object.keys( errors )[ 0 ] ]?.category_id;

			if ( categoryID === undefined ) {
				return null;
			}

			return categoryID;
		}
	),

	/**
	 * Checks whether an invitation is in progress for a given user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state  Data store's state.
	 * @param {number} userID User ID.
	 * @return {boolean} True if invitation request is in progress, otherwise false.
	 */
	isInvitingUser( state, userID ) {
		return !! state.emailReporting?.invitingUsers?.[ userID ];
	},
};

const store = combineStores(
	fetchGetEmailReportingSettingsStore,
	fetchSaveEmailReportingSettingsStore,
	fetchGetEligibleSubscribersStore,
	fetchGetEmailReportingErrorsStore,
	fetchInviteUserStore,
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
