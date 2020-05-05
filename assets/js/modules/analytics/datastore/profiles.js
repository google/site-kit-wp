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
import { isValidPropertyID, parsePropertyID } from '../util';
import { STORE_NAME, PROFILE_CREATE } from './constants';

// Actions
const FETCH_CREATE_PROFILE = 'FETCH_CREATE_PROFILE';
const START_FETCH_CREATE_PROFILE = 'START_FETCH_CREATE_PROFILE';
const FINISH_FETCH_CREATE_PROFILE = 'FINISH_FETCH_CREATE_PROFILE';
const CATCH_FETCH_CREATE_PROFILE = 'CATCH_FETCH_CREATE_PROFILE';

const FETCH_PROFILES = 'FETCH_PROFILES';
const START_FETCH_PROFILES = 'START_FETCH_PROFILES';
const FINISH_FETCH_PROFILES = 'FINISH_FETCH_PROFILES';
const CATCH_FETCH_PROFILES = 'CATCH_FETCH_PROFILES';

const RECEIVE_CREATE_PROFILE = 'RECEIVE_CREATE_PROFILE';
const RECEIVE_PROFILES = 'RECEIVE_PROFILES';

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
	 * @param {string} propertyID Google Analytics property ID.
	 * @return {Object} Response and error objects.
	 */
	*createProfile( propertyID ) {
		invariant( isValidPropertyID( propertyID ), 'a valid property ID is required to create a profile.' );
		let response, error;

		yield {
			payload: { propertyID },
			type: START_FETCH_CREATE_PROFILE,
		};

		try {
			response = yield {
				payload: { propertyID },
				type: FETCH_CREATE_PROFILE,
			};
			const profile = response;

			yield actions.receiveCreateProfile( { propertyID, profile } );

			yield {
				payload: { propertyID },
				type: FINISH_FETCH_CREATE_PROFILE,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					propertyID,
					error,
				},
				type: CATCH_FETCH_CREATE_PROFILE,
			};
		}

		return { response, error };
	},
	/**
	 * Fetches profiles from the server and add them to the store.
	 *
	 * @param {string} propertyID Google Analytics property ID.
	 * @return {Object} Response and error objects.
	 */
	*fetchProfiles( propertyID ) {
		invariant( isValidPropertyID( propertyID ), 'a valid property ID is required to fetch profiles for.' );
		let response, error;

		yield {
			payload: { propertyID },
			type: START_FETCH_PROFILES,
		};

		try {
			response = yield {
				payload: { propertyID },
				type: FETCH_PROFILES,
			};

			yield actions.receiveProfiles( response, { propertyID } );

			yield {
				payload: { propertyID },
				type: FINISH_FETCH_PROFILES,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					propertyID,
					error,
				},
				type: CATCH_FETCH_PROFILES,
			};
		}

		return { response, error };
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
	 * @param {string} args.propertyID Google Analytics profile ID.
	 * @param {Object} args.profile    Google Analytics profile object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateProfile( { propertyID, profile } ) {
		invariant( propertyID, 'propertyID is required.' );
		invariant( profile, 'profile is required.' );

		return {
			payload: { propertyID, profile },
			type: RECEIVE_CREATE_PROFILE,
		};
	},

	receiveProfiles( profiles, { propertyID } ) {
		invariant( Array.isArray( profiles ), 'profiles must be an array.' );

		return {
			payload: { profiles, propertyID },
			type: RECEIVE_PROFILES,
		};
	},
};

export const controls = {
	[ FETCH_CREATE_PROFILE ]: ( { payload: { propertyID } } ) => {
		const { accountID } = parsePropertyID( propertyID );

		return API.set( 'modules', 'analytics', 'create-profile', {
			accountID,
			propertyID,
		} );
	},
	[ FETCH_PROFILES ]: ( { payload: { propertyID } } ) => {
		const { accountID } = parsePropertyID( propertyID );

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
		case START_FETCH_CREATE_PROFILE: {
			const { propertyID } = payload;

			return {
				...state,
				isFetchingCreateProfile: {
					...state.isFetchingCreateProfile,
					[ propertyID ]: true,
				},
			};
		}

		case FINISH_FETCH_CREATE_PROFILE: {
			const { propertyID } = payload;

			return {
				...state,
				isFetchingCreateProfile: {
					...state.isFetchingCreateProfile,
					[ propertyID ]: false,
				},
			};
		}

		case CATCH_FETCH_CREATE_PROFILE: {
			const { error, propertyID } = payload;

			return {
				...state,
				error,
				isFetchingCreateProfile: {
					...state.isFetchingCreateProfile,
					[ propertyID ]: false,
				},
			};
		}

		case START_FETCH_PROFILES: {
			const { propertyID } = payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ propertyID ]: true,
				},
			};
		}

		case FINISH_FETCH_PROFILES: {
			const { propertyID } = payload;

			return {
				...state,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ propertyID ]: false,
				},
			};
		}

		case CATCH_FETCH_PROFILES: {
			const { error, propertyID } = payload;

			return {
				...state,
				error,
				isFetchingProfiles: {
					...state.isFetchingProfiles,
					[ propertyID ]: false,
				},
			};
		}

		case RECEIVE_CREATE_PROFILE: {
			const { propertyID, profile } = payload;

			return {
				...state,
				profiles: {
					...state.profiles,
					[ propertyID ]: [
						...( state.profiles[ propertyID ] || [] ),
						profile,
					],
				},
			};
		}

		case RECEIVE_PROFILES: {
			const { profiles, propertyID } = payload;

			return {
				...state,
				profiles: {
					...state.profiles,
					[ propertyID ]: [ ...profiles ],
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getProfiles( propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();

		let profiles = registry.select( STORE_NAME ).getProfiles( propertyID );

		// Only fetch profiles if there are none received for the given account and property.
		if ( ! profiles ) {
			( { response: profiles } = yield actions.fetchProfiles( propertyID ) );
		}

		const profileID = registry.select( STORE_NAME ).getProfileID();
		if ( profiles && ! profileID ) {
			const profile = profiles[ 0 ] || { id: PROFILE_CREATE };
			registry.dispatch( STORE_NAME ).setProfileID( profile.id );
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
	 * @param {string} propertyID The Analytics Property ID to fetch profiles for.
	 * @return {?Array.<Object>} An array of Analytics profiles; `undefined` if not loaded.
	 */
	getProfiles( state, propertyID ) {
		const { profiles } = state;

		return profiles[ propertyID ];
	},

	/**
	 * Check if a profile is being created for an account and property.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The Analytics Property ID to check for profile creation.
	 * @return {boolean} `true` if creating a profile, `false` if not.
	 */
	isDoingCreateProfile( state, propertyID ) {
		const { isFetchingCreateProfile } = state;

		return !! isFetchingCreateProfile[ propertyID ];
	},

	/**
	 * Checks if profiles are being fetched for the given account and property.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} propertyID The Analytics Property ID to check for profile fetching.
	 * @return {boolean} `true` if fetching a profiles, `false` if not.
	 */
	isDoingGetProfiles( state, propertyID ) {
		const { isFetchingProfiles } = state;

		return !! isFetchingProfiles[ propertyID ];
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
