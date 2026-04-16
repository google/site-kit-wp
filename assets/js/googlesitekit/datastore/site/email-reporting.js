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
import { stringifyObject } from '@/js/util';

const START_INVITING_USER = 'START_INVITING_USER';
const FINISH_INVITING_USER = 'FINISH_INVITING_USER';
const RESET_ELIGIBLE_SUBSCRIBERS = 'RESET_ELIGIBLE_SUBSCRIBERS';
const DEFAULT_ELIGIBLE_SUBSCRIBERS_ARGS = {
	page: 1,
	search: '',
};

function normalizeEligibleSubscribersArgs( args = {} ) {
	const normalizedArgs = isPlainObject( args ) ? args : {};
	const page = Number.parseInt( normalizedArgs.page, 10 );

	return {
		page:
			Number.isInteger( page ) && page > 0
				? page
				: DEFAULT_ELIGIBLE_SUBSCRIBERS_ARGS.page,
		search:
			typeof normalizedArgs.search === 'string'
				? normalizedArgs.search
				: DEFAULT_ELIGIBLE_SUBSCRIBERS_ARGS.search,
	};
}

function getEligibleSubscribersCacheKey( args = {} ) {
	// Normalize args first so equivalent requests share one key (e.g. {} and { page: 1, search: '' }).
	// This lets the selector/resolver reuse previously fetched results and prevents mixing results across different page/search queries.
	return stringifyObject( normalizeEligibleSubscribersArgs( args ) );
}

const baseInitialState = {
	emailReporting: {
		settings: undefined,
		savedSettings: undefined,
		eligibleSubscribers: {},
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
	controlCallback: ( params ) =>
		get( 'core', 'site', 'email-reporting-eligible-subscribers', params, {
			useCache: false,
		} ),
	reducerCallback: createReducer(
		( state, eligibleSubscribers, eligibleSubscribersArgs ) => {
			const cacheKey = getEligibleSubscribersCacheKey(
				eligibleSubscribersArgs
			);
			// Persist the response under its query key so future identical requests can be served from store state.
			state.emailReporting.eligibleSubscribers[ cacheKey ] =
				eligibleSubscribers;
		}
	),
	argsToParams: ( eligibleSubscribersArgs ) => {
		invariant(
			isPlainObject( eligibleSubscribersArgs ),
			'eligibleSubscribersArgs should be an object.'
		);

		return normalizeEligibleSubscribersArgs( eligibleSubscribersArgs );
	},
	validateParams: ( { page, search } = {} ) => {
		invariant(
			Number.isInteger( page ) && page > 0,
			'page should be a positive integer.'
		);
		invariant( typeof search === 'string', 'search should be a string.' );
	},
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
		Object.values( state.emailReporting.eligibleSubscribers ).forEach(
			( cachedResult ) => {
				if ( ! isPlainObject( cachedResult ) ) {
					return;
				}

				const users = sanitizeEligibleSubscribersUsers(
					cachedResult.users
				);
				const user = users.find(
					( potentialNewlyInvitedUser ) =>
						potentialNewlyInvitedUser.id === userID
				);

				if ( user ) {
					user.invited = true;
				}
			}
		);
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
	 * @since 1.173.0
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
	 * @since 1.173.0
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
	 * @since 1.173.0
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

	/**
	 * Resets the eligible subscribers cache.
	 *
	 * @since 1.177.0
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetEligibleSubscribers() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			type: RESET_ELIGIBLE_SUBSCRIBERS,
			payload: {},
		};

		return dispatch( CORE_SITE ).invalidateResolutionForStoreSelector(
			'getEligibleSubscribers'
		);
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
		case RESET_ELIGIBLE_SUBSCRIBERS: {
			state.emailReporting.eligibleSubscribers =
				baseInitialState.emailReporting.eligibleSubscribers;
			break;
		}

		default:
			break;
	}
} );

function sanitizeEligibleSubscribersUsers( users ) {
	return Array.isArray( users ) ? users : [];
}

function sanitizeEligibleSubscribersTotal( total ) {
	return Number.isInteger( total ) && total >= 0 ? total : 0;
}

function sanitizeEligibleSubscribersTotalPages( totalPages ) {
	return Number.isInteger( totalPages ) && totalPages >= 0 ? totalPages : 0;
}

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
	*getEligibleSubscribers( eligibleSubscribersArgs = {} ) {
		const registry = yield commonActions.getRegistry();
		const normalizedArgs = normalizeEligibleSubscribersArgs(
			eligibleSubscribersArgs
		);
		const isFetchingGetEligibleSubscribers = registry
			.select( CORE_SITE )
			.isFetchingGetEligibleSubscribers( normalizedArgs );

		if ( isFetchingGetEligibleSubscribers ) {
			return;
		}

		const eligibleSubscribers = registry
			.select( CORE_SITE )
			.getEligibleSubscribers( normalizedArgs );

		if ( eligibleSubscribers !== undefined ) {
			return;
		}

		const { response: firstPageResponse } =
			yield fetchGetEligibleSubscribersStore.actions.fetchGetEligibleSubscribers(
				normalizedArgs
			);

		if ( ! firstPageResponse ) {
			return;
		}

		const totalPages = sanitizeEligibleSubscribersTotalPages(
			firstPageResponse.totalPages
		);
		const shouldFetchAllPages =
			normalizedArgs.page === DEFAULT_ELIGIBLE_SUBSCRIBERS_ARGS.page;

		if ( ! shouldFetchAllPages || totalPages <= normalizedArgs.page ) {
			return;
		}

		let users = sanitizeEligibleSubscribersUsers( firstPageResponse.users );

		for ( let page = normalizedArgs.page + 1; page <= totalPages; page++ ) {
			const { response } =
				yield fetchGetEligibleSubscribersStore.actions.fetchGetEligibleSubscribers(
					{
						...normalizedArgs,
						page,
					}
				);

			users = users.concat(
				sanitizeEligibleSubscribersUsers( response?.users )
			);
		}

		if ( totalPages > normalizedArgs.page ) {
			yield fetchGetEligibleSubscribersStore.actions.receiveGetEligibleSubscribers(
				{
					users,
					total: sanitizeEligibleSubscribersTotal(
						firstPageResponse.total
					),
					totalPages,
				},
				normalizedArgs
			);
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
	 * @param {Object} state                     Data store's state.
	 * @param {Object} [eligibleSubscribersArgs] Query args.
	 * @return {(Object|undefined)} Eligible subscribers data; `undefined` if not loaded.
	 */
	getEligibleSubscribers: createRegistrySelector(
		( select ) =>
			( state, eligibleSubscribersArgs = {} ) => {
				const normalizedArgs = normalizeEligibleSubscribersArgs(
					eligibleSubscribersArgs
				);
				const eligibleSubscribers =
					state.emailReporting?.eligibleSubscribers?.[
						getEligibleSubscribersCacheKey( normalizedArgs )
					];

				if ( eligibleSubscribers === undefined ) {
					return undefined;
				}

				const currentUserID = select( CORE_USER ).getID();

				return {
					users: sanitizeEligibleSubscribersUsers(
						eligibleSubscribers.users
					)
						.filter(
							( user ) =>
								Number( user.id ) !== Number( currentUserID )
						)
						.map( ( user ) => ( {
							id: user.id,
							name: user.displayName || user.name,
							email: user.email,
							role: user.role,
							subscribed: user.subscribed,
							invited: user.invited,
						} ) ),
					total: sanitizeEligibleSubscribersTotal(
						eligibleSubscribers.total
					),
					totalPages: sanitizeEligibleSubscribersTotalPages(
						eligibleSubscribers.totalPages
					),
				};
			}
	),

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
	 * Gets the latest email reporting error.
	 *
	 * @since 1.174.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|null|undefined)} The latest email reporting error; `undefined` if not loaded; null if no errors.
	 */
	getLatestEmailReportingError: createRegistrySelector( ( select ) => () => {
		const { errors, error_data: errorData } =
			select( CORE_SITE ).getEmailReportingErrors() || {};

		if ( errors === undefined ) {
			return undefined;
		}

		const error = errorData?.[ Object.keys( errors )[ 0 ] ];

		if ( error === undefined ) {
			return null;
		}

		return error;
	} ),

	/**
	 * Checks whether an invitation is in progress for a given user.
	 *
	 * @since 1.173.0
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
