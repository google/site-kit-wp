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
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { stringifyObject } from '@/js/util';
import { CORE_SITE } from './constants';

const START_INVITING_USER = 'START_INVITING_USER';
const FINISH_INVITING_USER = 'FINISH_INVITING_USER';
const START_UNSUBSCRIBING_USER = 'START_UNSUBSCRIBING_USER';
const FINISH_UNSUBSCRIBING_USER = 'FINISH_UNSUBSCRIBING_USER';
const RESET_ELIGIBLE_SUBSCRIBERS = 'RESET_ELIGIBLE_SUBSCRIBERS';
const RESET_SUBSCRIBED_USERS = 'RESET_SUBSCRIBED_USERS';
const DISMISS_UNSUBSCRIBED_USER = 'DISMISS_UNSUBSCRIBED_USER';
const DEFAULT_USER_LIST_ARGS = {
	page: 1,
	search: '',
};

/**
 * Normalizes user list args to a whole page number and a string search term.
 *
 * @since 1.175.0
 * @since n.e.x.t Renamed from normalizeEligibleSubscribersArgs.
 *
 * @param {Object} [args] Page and search args.
 * @return {Object} Object with a positive integer `page` and a string `search`.
 */
function normalizeUserListArgs( args = {} ) {
	const normalizedArgs = isPlainObject( args ) ? args : {};
	const page = Number.parseInt( normalizedArgs.page, 10 );

	return {
		page:
			Number.isInteger( page ) && page > 0
				? page
				: DEFAULT_USER_LIST_ARGS.page,
		search:
			typeof normalizedArgs.search === 'string'
				? normalizedArgs.search
				: DEFAULT_USER_LIST_ARGS.search,
	};
}

/**
 * Builds the cache key a user list result is stored under.
 *
 * @since 1.175.0
 * @since n.e.x.t Renamed from getEligibleSubscribersCacheKey.
 *
 * @param {Object} [args] Page and search args.
 * @return {string} Cache key for the normalized args.
 */
function getUserListCacheKey( args = {} ) {
	// Normalize args first so equivalent requests share one key (e.g. {} and { page: 1, search: '' }).
	// This lets the selector/resolver reuse previously fetched results and prevents mixing results across different page/search queries.
	return stringifyObject( normalizeUserListArgs( args ) );
}

const baseInitialState = {
	emailReporting: {
		settings: undefined,
		savedSettings: undefined,
		eligibleSubscribers: {},
		subscribedUsers: {},
		justUnsubscribedUsers: {},
		errors: undefined,
		invitingUsers: {},
		unsubscribingUsers: {},
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
	isAction: true,
} );

const fetchGetEligibleSubscribersStore = createFetchStore( {
	baseName: 'getEligibleSubscribers',
	controlCallback: ( params ) =>
		get( 'core', 'site', 'email-reporting-eligible-subscribers', params, {
			useCache: false,
		} ),
	reducerCallback: createReducer(
		( state, eligibleSubscribers, eligibleSubscribersArgs ) => {
			const cacheKey = getUserListCacheKey( eligibleSubscribersArgs );
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

		return normalizeUserListArgs( eligibleSubscribersArgs );
	},
	validateParams: ( { page, search } = {} ) => {
		invariant(
			Number.isInteger( page ) && page > 0,
			'page should be a positive integer.'
		);
		invariant( typeof search === 'string', 'search should be a string.' );
	},
} );

const fetchGetSubscribedUsersStore = createFetchStore( {
	baseName: 'getSubscribedUsers',
	controlCallback: ( params ) =>
		get( 'core', 'site', 'email-reporting-subscribed-users', params, {
			useCache: false,
		} ),
	reducerCallback: createReducer(
		( state, subscribedUsers, subscribedUsersArgs ) => {
			const cacheKey = getUserListCacheKey( subscribedUsersArgs );
			state.emailReporting.subscribedUsers[ cacheKey ] = subscribedUsers;
		}
	),
	argsToParams: ( subscribedUsersArgs ) => {
		invariant(
			isPlainObject( subscribedUsersArgs ),
			'subscribedUsersArgs should be an object.'
		);

		return normalizeUserListArgs( subscribedUsersArgs );
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

				const users = sanitizeUserListUsers( cachedResult.users );
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
	isAction: true,
} );

const fetchUnsubscribeUserStore = createFetchStore( {
	baseName: 'unsubscribeUser',
	controlCallback: ( { userID } ) =>
		set( 'core', 'site', 'email-reporting-unsubscribe-user', {
			userID,
		} ),
	// The store keeps one subscribed-users result per page and search term, so remove
	// the user from every cached result. getSubscribedUsers then reports the change
	// without a refetch. The removed user is also snapshotted into
	// justUnsubscribedUsers, so getJustUnsubscribedUsers can keep reporting them to
	// any consumer until dismissUnsubscribedUser is called for them.
	reducerCallback: createReducer( ( state, response, { userID } ) => {
		Object.values( state.emailReporting.subscribedUsers ).forEach(
			( cachedResult ) => {
				if ( ! isPlainObject( cachedResult ) ) {
					return;
				}

				const users = sanitizeUserListUsers( cachedResult.users );
				const unsubscribedUser = users.find(
					( subscribedUser ) => subscribedUser.id === userID
				);

				if ( ! unsubscribedUser ) {
					return;
				}

				cachedResult.users = users.filter(
					( subscribedUser ) => subscribedUser.id !== userID
				);
				cachedResult.total = Math.max(
					sanitizeUserListTotal( cachedResult.total ) - 1,
					0
				);

				if ( ! state.emailReporting.justUnsubscribedUsers[ userID ] ) {
					state.emailReporting.justUnsubscribedUsers[ userID ] =
						unsubscribedUser;
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
	isAction: true,
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
	 * Unsubscribes a user from email reports and removes them from every cached subscribed-users listing.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID Subscribed user ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	unsubscribeUser: createValidatedAction(
		( userID ) => {
			invariant(
				Number.isInteger( userID ) && userID > 0,
				'userID should be a positive integer.'
			);
		},
		function* ( userID ) {
			const registry = yield commonActions.getRegistry();

			registry.dispatch( CORE_SITE ).startUnsubscribingUser( userID );

			try {
				const result =
					yield fetchUnsubscribeUserStore.actions.fetchUnsubscribeUser(
						userID
					);

				return result;
			} finally {
				registry
					.dispatch( CORE_SITE )
					.finishUnsubscribingUser( userID );
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
	 * Marks an unsubscribe request as in progress for a user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID User ID.
	 * @return {Object} Redux-style action.
	 */
	startUnsubscribingUser( userID ) {
		return {
			type: START_UNSUBSCRIBING_USER,
			payload: { userID },
		};
	},

	/**
	 * Marks a user's unsubscribe request as finished.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID User ID.
	 * @return {Object} Redux-style action.
	 */
	finishUnsubscribingUser( userID ) {
		return {
			type: FINISH_UNSUBSCRIBING_USER,
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

	/**
	 * Clears the subscribed users cache, so the next read fetches fresh data.
	 *
	 * Also clears justUnsubscribedUsers, since a full refetch supersedes any
	 * pending unsubscribe snapshots taken from the stale cache.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Redux-style action.
	 */
	*resetSubscribedUsers() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			type: RESET_SUBSCRIBED_USERS,
			payload: {},
		};

		return dispatch( CORE_SITE ).invalidateResolutionForStoreSelector(
			'getSubscribedUsers'
		);
	},

	/**
	 * Dismisses a just-unsubscribed user, so `getJustUnsubscribedUsers` stops
	 * reporting them.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} userID Subscribed user ID.
	 * @return {Object} Redux-style action.
	 */
	dismissUnsubscribedUser( userID ) {
		invariant(
			Number.isInteger( userID ) && userID > 0,
			'userID should be a positive integer.'
		);

		return {
			type: DISMISS_UNSUBSCRIBED_USER,
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
		case START_UNSUBSCRIBING_USER: {
			state.emailReporting.unsubscribingUsers[ payload.userID ] = true;
			break;
		}
		case FINISH_UNSUBSCRIBING_USER: {
			state.emailReporting.unsubscribingUsers[ payload.userID ] = false;
			break;
		}
		case RESET_ELIGIBLE_SUBSCRIBERS: {
			state.emailReporting.eligibleSubscribers =
				baseInitialState.emailReporting.eligibleSubscribers;
			break;
		}
		case RESET_SUBSCRIBED_USERS: {
			state.emailReporting.subscribedUsers =
				baseInitialState.emailReporting.subscribedUsers;
			state.emailReporting.justUnsubscribedUsers =
				baseInitialState.emailReporting.justUnsubscribedUsers;
			break;
		}
		case DISMISS_UNSUBSCRIBED_USER: {
			delete state.emailReporting.justUnsubscribedUsers[ payload.userID ];
			break;
		}

		default:
			break;
	}
} );

/**
 * Returns the given users when they form an array, and an empty array otherwise.
 *
 * @since 1.175.0
 * @since n.e.x.t Renamed from sanitizeEligibleSubscribersUsers.
 *
 * @param {Array} users Users from a user list response.
 * @return {Array} The given users, or an empty array.
 */
function sanitizeUserListUsers( users ) {
	return Array.isArray( users ) ? users : [];
}

/**
 * Returns the given total when it reads as a whole number of zero or more, and zero otherwise.
 *
 * @since 1.175.0
 * @since n.e.x.t Renamed from sanitizeEligibleSubscribersTotal.
 *
 * @param {number} total Total from a user list response.
 * @return {number} The given total, or zero.
 */
function sanitizeUserListTotal( total ) {
	return Number.isInteger( total ) && total >= 0 ? total : 0;
}

/**
 * Returns the given page count when it reads as a whole number of zero or more, and zero otherwise.
 *
 * @since 1.175.0
 * @since n.e.x.t Renamed from sanitizeEligibleSubscribersTotalPages.
 *
 * @param {number} totalPages Page count from a user list response.
 * @return {number} The given page count, or zero.
 */
function sanitizeUserListTotalPages( totalPages ) {
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
		const normalizedArgs = normalizeUserListArgs( eligibleSubscribersArgs );
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

		const totalPages = sanitizeUserListTotalPages(
			firstPageResponse.totalPages
		);
		const shouldFetchAllPages =
			normalizedArgs.page === DEFAULT_USER_LIST_ARGS.page;

		if ( ! shouldFetchAllPages || totalPages <= normalizedArgs.page ) {
			return;
		}

		let users = sanitizeUserListUsers( firstPageResponse.users );

		for ( let page = normalizedArgs.page + 1; page <= totalPages; page++ ) {
			const { response } =
				yield fetchGetEligibleSubscribersStore.actions.fetchGetEligibleSubscribers(
					{
						...normalizedArgs,
						page,
					}
				);

			users = users.concat( sanitizeUserListUsers( response?.users ) );
		}

		if ( totalPages > normalizedArgs.page ) {
			yield fetchGetEligibleSubscribersStore.actions.receiveGetEligibleSubscribers(
				{
					users,
					total: sanitizeUserListTotal( firstPageResponse.total ),
					totalPages,
				},
				normalizedArgs
			);
		}
	},
	*getSubscribedUsers( subscribedUsersArgs = {} ) {
		const registry = yield commonActions.getRegistry();
		const normalizedArgs = normalizeUserListArgs( subscribedUsersArgs );
		const isFetchingGetSubscribedUsers = registry
			.select( CORE_SITE )
			.isFetchingGetSubscribedUsers( normalizedArgs );

		if ( isFetchingGetSubscribedUsers ) {
			return;
		}

		const subscribedUsers = registry
			.select( CORE_SITE )
			.getSubscribedUsers( normalizedArgs );

		if ( subscribedUsers !== undefined ) {
			return;
		}

		const { response: firstPageResponse } =
			yield fetchGetSubscribedUsersStore.actions.fetchGetSubscribedUsers(
				normalizedArgs
			);

		if ( ! firstPageResponse ) {
			return;
		}

		const totalPages = sanitizeUserListTotalPages(
			firstPageResponse.totalPages
		);
		const shouldFetchAllPages =
			normalizedArgs.page === DEFAULT_USER_LIST_ARGS.page;

		if ( ! shouldFetchAllPages || totalPages <= normalizedArgs.page ) {
			return;
		}

		let users = sanitizeUserListUsers( firstPageResponse.users );

		for ( let page = normalizedArgs.page + 1; page <= totalPages; page++ ) {
			const { response } =
				yield fetchGetSubscribedUsersStore.actions.fetchGetSubscribedUsers(
					{
						...normalizedArgs,
						page,
					}
				);

			users = users.concat( sanitizeUserListUsers( response?.users ) );
		}

		if ( totalPages > normalizedArgs.page ) {
			yield fetchGetSubscribedUsersStore.actions.receiveGetSubscribedUsers(
				{
					users,
					total: sanitizeUserListTotal( firstPageResponse.total ),
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
				const normalizedArgs = normalizeUserListArgs(
					eligibleSubscribersArgs
				);
				const eligibleSubscribers =
					state.emailReporting?.eligibleSubscribers?.[
						getUserListCacheKey( normalizedArgs )
					];

				if ( eligibleSubscribers === undefined ) {
					return undefined;
				}

				const currentUserID = select( CORE_USER ).getID();

				return {
					users: sanitizeUserListUsers( eligibleSubscribers.users )
						.filter(
							( user ) =>
								Number( user.id ) !== Number( currentUserID )
						)
						.map( ( user ) => ( {
							id: user.id,
							name: user.displayName || user.name,
							email: user.email,
							role: user.roleDisplayName || user.role,
							subscribed: user.subscribed,
							invited: user.invited,
						} ) ),
					total: sanitizeUserListTotal( eligibleSubscribers.total ),
					totalPages: sanitizeUserListTotalPages(
						eligibleSubscribers.totalPages
					),
				};
			}
	),

	/**
	 * Gets the subscribed users list and its total for the given page and search args.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state                 Data store's state.
	 * @param {Object} [subscribedUsersArgs] Page and search args.
	 * @return {(Object|undefined)} The subscribed users and their total count; `undefined` if not loaded.
	 */
	getSubscribedUsers( state, subscribedUsersArgs = {} ) {
		const normalizedArgs = normalizeUserListArgs( subscribedUsersArgs );
		const subscribedUsers =
			state.emailReporting?.subscribedUsers?.[
				getUserListCacheKey( normalizedArgs )
			];

		if ( subscribedUsers === undefined ) {
			return undefined;
		}

		return {
			users: sanitizeUserListUsers( subscribedUsers.users ).map(
				( user ) => ( {
					id: user.id,
					name: user.displayName || user.name,
					email: user.email,
					role: user.roleDisplayName || user.role,
				} )
			),
			total: sanitizeUserListTotal( subscribedUsers.total ),
		};
	},

	/**
	 * Gets users who were just unsubscribed and haven't been dismissed yet.
	 *
	 * `unsubscribeUser` removes a user from every cached `getSubscribedUsers`
	 * result immediately, but keeps reporting them here, keyed by user ID,
	 * until a `dismissUnsubscribedUser` call for them. This lets any
	 * consumer of this store keep a just-unsubscribed user's row visible
	 * (e.g. to show a confirmation) instead of the user simply vanishing.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object} Just-unsubscribed users keyed by ID, in the same shape as `getSubscribedUsers().users` entries.
	 */
	getJustUnsubscribedUsers( state ) {
		return Object.fromEntries(
			Object.entries(
				state.emailReporting?.justUnsubscribedUsers || {}
			).map( ( [ userID, user ] ) => [
				userID,
				{
					id: user.id,
					name: user.displayName || user.name,
					email: user.email,
					role: user.roleDisplayName || user.role,
				},
			] )
		);
	},

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

	/**
	 * Checks whether a user's unsubscribe request is still running.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state  Data store's state.
	 * @param {number} userID User ID.
	 * @return {boolean} True if an unsubscribe request is in progress, otherwise false.
	 */
	isUnsubscribingUser( state, userID ) {
		return !! state.emailReporting?.unsubscribingUsers?.[ userID ];
	},
};

const store = combineStores(
	fetchGetEmailReportingSettingsStore,
	fetchSaveEmailReportingSettingsStore,
	fetchGetEligibleSubscribersStore,
	fetchGetSubscribedUsersStore,
	fetchGetEmailReportingErrorsStore,
	fetchInviteUserStore,
	fetchUnsubscribeUserStore,
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
