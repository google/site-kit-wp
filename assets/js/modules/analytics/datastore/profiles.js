/**
 * modules/analytics data store: profiles.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './index';
import { isValidAccountID, isValidPropertyID } from '../util';
import { PROFILE_CREATE } from './constants';

// Actions
const FETCH_CREATE_PROFILE = 'FETCH_CREATE_PROFILE';
const FETCH_PROFILES = 'FETCH_PROFILES';
const RECEIVE_CREATE_PROFILE = 'RECEIVE_CREATE_PROFILE';
const RECEIVE_CREATE_PROFILE_FAILED = 'RECEIVE_CREATE_PROFILE_FAILED';
const RECEIVE_PROFILES = 'RECEIVE_PROFILES';
const RECEIVE_PROFILES_COMPLETED = 'RECEIVE_PROFILES_COMPLETED';
const RECEIVE_PROFILES_FAILED = 'RECEIVE_PROFILES_FAILED';

export const INITIAL_STATE = {
	isFetchingCreateProfile: {},
	isFetchingProfiles: {},
	profiles: {},
};

export const actions = {
	/**
	 * Creates a new Analytics profile.
	 *
	 * Creates a new Analytics profile for an existing Google Analytics
	 * account + property combination.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} accountID  Google Analytics account ID.
	 * @param {string} propertyID Google Analytics property ID.
	 * @return {Function} Generator function action.
	 */
	*createProfile( accountID, propertyID ) {
		invariant( accountID, 'accountID is required.' );
		invariant( propertyID, 'propertyID is required.' );

		try {
			const profile = yield actions.fetchCreateProfile( accountID, propertyID );

			const registry = yield Data.commonActions.getRegistry();
			registry.dispatch( STORE_NAME ).setProfileID( profile.id );

			return actions.receiveCreateProfile( { accountID, propertyID, profile } );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveCreateProfileFailed( { accountID, error, propertyID } );
		}
	},

	fetchCreateProfile( accountID, propertyID ) {
		return {
			payload: { accountID, propertyID },
			type: FETCH_CREATE_PROFILE,
		};
	},

	fetchProfiles( accountID, propertyID ) {
		return {
			payload: { accountID, propertyID },
			type: FETCH_PROFILES,
		};
	},

	/**
	 * Adds a property to the data store.
	 *
	 * Adds the newly-created property to the existing properties in
	 * the data store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args            Argument params.
	 * @param {string} args.accountID  Google Analytics account ID.
	 * @param {string} args.propertyID Google Analytics profile ID.
	 * @param {Object} args.profile    Google Analytics profile object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProfile( { accountID, propertyID, profile } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( propertyID, 'propertyID is required.' );
		invariant( profile, 'profile is required.' );

		return {
			payload: { accountID, propertyID, profile },
			type: RECEIVE_CREATE_PROFILE,
		};
	},

	/**
	 * Logs an error with profile creation.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args            Argument params.
	 * @param {string} args.accountID  Google Analytics account ID.
	 * @param {string} args.propertyID Google Analytics property ID.
	 * @param {Object} args.error      Error object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProfileFailed( { accountID, propertyID, error } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( propertyID, 'propertyID is required.' );
		invariant( error, 'error is required.' );

		return {
			payload: { accountID, error, propertyID },
			type: RECEIVE_CREATE_PROFILE_FAILED,
		};
	},

	receiveProfiles( profiles ) {
		invariant( Array.isArray( profiles ), 'profiles must be an array.' );

		return {
			payload: { profiles },
			type: RECEIVE_PROFILES,
		};
	},

	receiveProfilesCompleted( accountID, propertyID ) {
		invariant( accountID, 'accountID is required.' );
		invariant( propertyID, 'propertyID is required.' );

		return {
			payload: { accountID, propertyID },
			type: RECEIVE_PROFILES_COMPLETED,
		};
	},

	receiveProfilesFailed( { accountID, error, propertyID } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( error, 'error is required.' );
		invariant( propertyID, 'propertyID is required.' );

		return {
			payload: { accountID, error, propertyID },
			type: RECEIVE_PROFILES_FAILED,
		};
	},

	/**
	 * Sets a profile based on given account and property IDs.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {?Object} args Optional supporting arguments.
	 * @param {?string} args.accountID Account ID.
	 * @param {?string} args.property Property ID.
	 */
	*setProfileForProperty( { accountID, propertyID } = {} ) {
		const registry = yield Data.commonActions.getRegistry();

		if ( isValidAccountID( accountID ) && isValidPropertyID( propertyID ) ) {
			const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID ) || [];
			const matchedProfile = profiles.find( ( { webPropertyId } ) => webPropertyId === propertyID ) || { id: PROFILE_CREATE };

			registry.dispatch( STORE_NAME ).setProfileID( matchedProfile.id );
		} else {
			registry.dispatch( STORE_NAME ).setProfileID( PROFILE_CREATE );
		}
	},
};

export const controls = {
	[ FETCH_CREATE_PROFILE ]: ( { payload: { accountID, propertyID } } ) => {
		return API.set( 'modules', 'analytics', 'create-profile', {
			accountID,
			propertyID,
		} );
	},
	[ FETCH_PROFILES ]: ( { payload: { accountID, propertyID } } ) => {
		return API.get( 'modules', 'analytics', 'profiles', {
			accountID,
			propertyID,
		}, {
			useCache: false,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_CREATE_PROFILE: {
			const { accountID, propertyID } = payload;

			return {
				...state,
				isFetchingCreateProfile: {
					...state.isFetchingCreateProfile,
					[ `${ accountID }::${ propertyID }` ]: true,
				},
			};
		}

		case FETCH_PROFILES: {
			const { accountID, propertyID } = payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountID }::${ propertyID }` ]: true,
				},
			};
		}

		case RECEIVE_CREATE_PROFILE: {
			const { accountID, propertyID, profile } = payload;

			return {
				...state,
				isFetchingCreateProfile: {
					...state.isFetchingCreateProfile,
					[ `${ accountID }::${ propertyID }` ]: false,
				},
				profiles: {
					...state.profiles,
					[ `${ accountID }::${ propertyID }` ]: [
						...( state.profiles[ `${ accountID }::${ propertyID }` ] || [] ),
						profile,
					],
				},
			};
		}

		case RECEIVE_CREATE_PROFILE_FAILED: {
			const { accountID, error, propertyID } = payload;

			return {
				...state,
				error,
				isFetchingCreateProfile: {
					...state.isFetchingCreateProfile,
					[ `${ accountID }::${ propertyID }` ]: false,
				},
			};
		}

		case RECEIVE_PROFILES: {
			const { profiles } = payload;

			return {
				...state,
				profiles: {
					...state.profiles,
					...groupBy( profiles, ( { accountId, webPropertyId } ) => `${ accountId }::${ webPropertyId }` ), // Capitalization rule exception: `accountId` and `webPropertyId` are properties of an API returned value.
				},
			};
		}

		case RECEIVE_PROFILES_COMPLETED: {
			const { accountID, propertyID } = payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountID }::${ propertyID }` ]: false,
				},
			};
		}

		case RECEIVE_PROFILES_FAILED: {
			const { accountID, error, propertyID } = payload;

			return {
				...state,
				error,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountID }::${ propertyID }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getProfiles( accountID, propertyID ) {
		if ( ! isValidAccountID( accountID ) || ! isValidPropertyID( propertyID ) ) {
			return;
		}

		try {
			const registry = yield Data.commonActions.getRegistry();

			const existingProfiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );

			// If there are already profiles loaded in state for this request; consider it fulfilled
			// and don't make an API request.
			if ( existingProfiles ) {
				return;
			}

			const profiles = yield actions.fetchProfiles( accountID, propertyID );

			yield actions.receiveProfiles( profiles );

			return actions.receiveProfilesCompleted( accountID, propertyID );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveProfilesFailed( { accountID, propertyID, error } );
		}
	},
};

export const selectors = {
	/**
	 * Get all Google Analytics profiles this user account+property has available.
	 *
	 * Returns an array of all profiles.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} accountID  The Analytics Account ID to fetch profiles for.
	 * @param {string} propertyID The Analytics Property ID to fetch profiles for.
	 * @return {?Array.<Object>} An array of Analytics profiles; `undefined` if not loaded.
	 */
	getProfiles( state, accountID, propertyID ) {
		const { profiles } = state;

		return profiles[ `${ accountID }::${ propertyID }` ];
	},

	/**
	 * Check if a profile is being created for an account and property.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} accountID  The Analytics Account ID to check for profile creation.
	 * @param {string} propertyID The Analytics Property ID to check for profile creation.
	 * @return {boolean} `true` if creating a profile, `false` if not.
	 */
	isDoingCreateProfile( state, accountID, propertyID ) {
		const { isFetchingCreateProfile } = state;

		return !! isFetchingCreateProfile[ `${ accountID }::${ propertyID }` ];
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
