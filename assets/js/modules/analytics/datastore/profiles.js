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

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './index';

// Actions
const FETCH_CREATE_PROFILE = 'FETCH_CREATE_PROFILE';
const FETCH_PROFILES = 'FETCH_PROFILES';
const RECEIVE_CREATE_PROFILE = 'RECEIVE_CREATE_PROFILE';
const RECEIVE_CREATE_PROFILE_FAILED = 'RECEIVE_CREATE_PROFILE_FAILED';
const RECEIVE_PROFILES = 'RECEIVE_PROFILES';
const RECEIVE_PROFILES_FAILED = 'RECEIVE_PROFILES_FAILED';

export const INITIAL_STATE = {
	isDoingCreateProfile: {},
	isFetchingProfiles: {},
	profiles: undefined,
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
	 * @param {string} accountId Google Analytics account ID.
	 * @param {string} propertyId Google Analytics property ID.
	 * @return {Function} Generator function action.
	 */
	*createProfile( accountId, propertyId ) {
		invariant( accountId, 'accountId is required.' );
		invariant( propertyId, 'propertyId is required.' );

		try {
			const response = yield actions.fetchCreateProfile( accountId, propertyId );

			const { profile } = response;

			yield actions.receiveCreateProfile( { accountId, propertyId, profile } );
			yield Data.dispatch( STORE_NAME ).setProfileID( profile.id );
			return;
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveCreateProfileFailed( { accountId, error, propertyId } );
		}
	},

	*fetchCreateProfile( accountId, propertyId ) {
		return {
			payload: { accountId, propertyId },
			type: FETCH_CREATE_PROFILE,
		};
	},

	*fetchProfiles( accountId, propertyId ) {
		return {
			payload: { accountId, propertyId },
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
	 * @param {Object} args Argument params.
	 * @param {string} args.accountId Google Analytics account ID.
	 * @param {string} args.propertyId Google Analytics profile ID.
	 * @param {Object} args.profile Google Analytics profile object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProfile( { accountId, propertyId, profile } ) {
		invariant( accountId, 'accountId is required.' );
		invariant( propertyId, 'propertyId is required.' );
		invariant( profile, 'profile is required.' );

		return {
			payload: { accountId, propertyId, profile },
			type: RECEIVE_CREATE_PROFILE,
		};
	},

	/**
	 * Logs an error with profile creation.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args Argument params.
	 * @param {string} args.accountId Google Analytics account ID.
	 * @param {string} args.propertyId Google Analytics property ID.
	 * @param {Object} args.error Error object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProfileFailed( { accountId, error, propertyId } ) {
		invariant( accountId, 'accountId is required' );
		invariant( error, 'error is required.' );
		invariant( propertyId, 'propertyId is required.' );

		return {
			payload: { accountId, error, propertyId },
			type: RECEIVE_CREATE_PROFILE_FAILED,
		};
	},

	receiveProfiles( { accountId, propertyId, profiles } ) {
		invariant( accountId, 'accountId is required' );
		invariant( propertyId, 'accountId is required' );
		invariant( profiles, 'profiles is required' );

		return {
			payload: { accountId, propertyId, profiles },
			type: RECEIVE_PROFILES,
		};
	},

	receiveProfilesFailed( { accountId, error, propertyId } ) {
		invariant( accountId, 'accountId is required' );
		invariant( error, 'error is required.' );
		invariant( propertyId, 'accountId is required' );

		return {
			payload: { accountId, error, propertyId },
			type: RECEIVE_PROFILES_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_CREATE_PROFILE ]: ( accountId, propertyId ) => {
		return API.set( 'modules', 'analytics', 'create-profile', {
			accountID: accountId,
			propertyID: propertyId,
		} );
	},
	[ FETCH_PROFILES ]: ( accountId, propertyId ) => {
		return API.get( 'modules', 'analytics', 'profiles', {
			accountID: accountId,
			propertyID: propertyId,
		} );
	},
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		case FETCH_CREATE_PROFILE: {
			const { accountId, propertyId } = action.payload;

			return {
				...state,
				isDoingCreateProperty: {
					...state.isDoingCreateProperty,
					[ `${ accountId }::${ propertyId }` ]: true,
				},
			};
		}

		case FETCH_PROFILES: {
			const { accountId, propertyId } = action.payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountId }::${ propertyId }` ]: true,
				},
			};
		}

		case RECEIVE_CREATE_PROFILE: {
			const { accountId, propertyId, profile } = action.payload;

			return {
				...state,
				isDoingCreateProfile: {
					...state.isDoingCreateProfile,
					[ `${ accountId }::${ propertyId }` ]: false,
				},
				profiles: [
					...state.profiles || [],
					profile,
				],
			};
		}

		case RECEIVE_CREATE_PROFILE_FAILED: {
			const { accountId, error, propertyId } = action.payload;

			return {
				...state,
				error,
				isDoingCreateProfile: {
					...state.isDoingCreateProfile,
					[ `${ accountId }::${ propertyId }` ]: false,
				},
			};
		}

		case RECEIVE_PROFILES: {
			const { accountId, propertyId, profiles } = action.payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountId }::${ propertyId }` ]: false,
				},
				profiles,
			};
		}

		case RECEIVE_PROFILES_FAILED: {
			const { accountId, error, propertyId } = action.payload;

			return {
				...state,
				error,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ `${ accountId }::${ propertyId }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getProfiles( accountId, propertyId ) {
		try {
			const response = yield actions.fetchProfiles( accountId, propertyId );
			const { profiles } = response;

			yield actions.receiveProfiles( { accountId, propertyId, profiles } );

			return;
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveProfilesFailed( { accountId, propertyId, error } );
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
	 * @param {Object} state Data store's state.
	 * @param {string} accountId The Analytics Account ID to fetch profiles for.
	 * @param {string} propertyId The Analytics Property ID to fetch profiles for.
	 * @return {Array|undefined} An array of Analytics profiles; `undefined` if not loaded.
	 */
	getProfiles( state, accountId, propertyId ) {
		invariant( accountId, 'accountId is required' );
		invariant( propertyId, 'propertyId is required' );

		const { profiles } = state;

		if ( profiles && profiles.length ) {
			return profiles.filter( ( profile ) => {
				return (
					profile.accountId === accountId &&
					profile.webPropertyId === propertyId
				);
			} );
		}

		return profiles;
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
