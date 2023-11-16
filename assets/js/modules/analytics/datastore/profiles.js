/**
 * `modules/analytics` data store: profiles.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import {
	isValidPropertyID,
	isValidProfileName,
	isValidAccountID,
} from '../util';
import { MODULES_ANALYTICS, PROFILE_CREATE } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistrySelector } = Data;

const fetchGetProfilesStore = createFetchStore( {
	baseName: 'getProfiles',
	controlCallback: ( { accountID, propertyID } ) => {
		return API.get(
			'modules',
			'analytics',
			'profiles',
			{
				accountID,
				propertyID,
			},
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, profiles, { accountID, propertyID } ) => {
		return {
			...state,
			profiles: {
				...state.profiles,
				[ `${ accountID }::${ propertyID }` ]: [ ...profiles ],
			},
		};
	},
	argsToParams: ( accountID, propertyID ) => {
		return { accountID, propertyID };
	},
	validateParams: ( { accountID, propertyID } = {} ) => {
		invariant(
			isValidAccountID( accountID ),
			'a valid account ID is required to fetch profiles for.'
		);
		invariant(
			isValidPropertyID( propertyID ),
			'a valid property ID is required to fetch profiles for.'
		);
	},
} );

const fetchCreateProfileStore = createFetchStore( {
	baseName: 'createProfile',
	controlCallback: ( { accountID, propertyID, profileName } ) => {
		return API.set( 'modules', 'analytics', 'create-profile', {
			accountID,
			propertyID,
			profileName,
		} );
	},
	reducerCallback: ( state, profile, { accountID, propertyID } ) => {
		return {
			...state,
			profiles: {
				...state.profiles,
				[ `${ accountID }::${ propertyID }` ]: [
					...( state.profiles[ `${ accountID }::${ propertyID }` ] ||
						[] ),
					profile,
				],
			},
		};
	},
	argsToParams: ( accountID, propertyID, { profileName } ) => {
		return { accountID, propertyID, profileName };
	},
	validateParams: ( { accountID, propertyID, profileName } = {} ) => {
		invariant(
			isValidAccountID( accountID ),
			'a valid account ID is required to create a profiles.'
		);
		invariant(
			isValidPropertyID( propertyID ),
			'a valid property ID is required to create a profile.'
		);
		invariant(
			isValidProfileName( profileName ),
			'a valid name is required to create a profile.'
		);
	},
} );

const baseInitialState = {
	profiles: {},
};

const baseActions = {
	/**
	 * Creates a new Analytics profile.
	 *
	 * Creates a new Analytics profile for an existing Google Analytics
	 * account + property combination.
	 *
	 * @since 1.8.0
	 *
	 * @param {string} accountID        Google Analytics account ID.
	 * @param {string} propertyID       Google Analytics property ID.
	 * @param {Object} args             Profile arguments.
	 * @param {string} args.profileName The name for a new profile.
	 * @return {Object} Object with `response` and `error`.
	 */
	createProfile: createValidatedAction(
		( accountID, propertyID, { profileName } ) => {
			invariant(
				isValidAccountID( accountID ),
				'a valid account ID is required to create a profile.'
			);
			invariant(
				isValidPropertyID( propertyID ),
				'a valid property ID is required to create a profile.'
			);
			invariant(
				isValidProfileName( profileName ),
				'a valid name is required to create a profile.'
			);
		},
		function* ( accountID, propertyID, { profileName } ) {
			const { response, error } =
				yield fetchCreateProfileStore.actions.fetchCreateProfile(
					accountID,
					propertyID,
					{ profileName }
				);
			return { response, error };
		}
	),

	/**
	 * Finds a profile that fits the provided property.
	 *
	 * @since 1.38.0
	 *
	 * @param {string} accountID        Account ID.
	 * @param {string} propertyID       Property ID.
	 * @param {string} defaultProfileID Optional. Default profile ID set for the property.
	 * @return {Object|undefined} Porfile object on success, otherwise undefined.
	 */
	*findPropertyProfile( accountID, propertyID, defaultProfileID = '' ) {
		const registry = yield Data.commonActions.getRegistry();
		const profiles = yield Data.commonActions.await(
			registry
				.resolveSelect( MODULES_ANALYTICS )
				.getProfiles( accountID, propertyID )
		);

		if ( defaultProfileID ) {
			const defaultProfile = profiles.find(
				( profile ) => profile.id === defaultProfileID
			);
			if ( defaultProfile ) {
				return defaultProfile;
			}
		}

		return profiles[ 0 ];
	},
};

const baseResolvers = {
	*getProfiles( accountID, propertyID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();

		let profiles = registry
			.select( MODULES_ANALYTICS )
			.getProfiles( accountID, propertyID );

		// Only fetch profiles if there are none received for the given account and property.
		if ( ! profiles ) {
			( { response: profiles } =
				yield fetchGetProfilesStore.actions.fetchGetProfiles(
					accountID,
					propertyID
				) );
		}

		const profileID = registry.select( MODULES_ANALYTICS ).getProfileID();
		if ( profiles && ! profileID ) {
			const profile = profiles[ 0 ] || { id: PROFILE_CREATE };
			registry.dispatch( MODULES_ANALYTICS ).setProfileID( profile.id );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all Google Analytics profiles this user account+property has available.
	 *
	 * Returns an array of all profiles.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} accountID  The Analytics Account ID to fetch profiles for.
	 * @param {string} propertyID The Analytics Property ID to fetch profiles for.
	 * @return {(Array.<Object>|undefined)} An array of Analytics profiles; `undefined` if not loaded.
	 */
	getProfiles( state, accountID, propertyID ) {
		const { profiles } = state;
		return profiles[ `${ accountID }::${ propertyID }` ];
	},

	/**
	 * Checks if a profile is being created for an account and property.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} `true` if creating a profile, `false` if not.
	 */
	isDoingCreateProfile( state ) {
		// Since isFetchingCreateProfile holds information based on specific values but we only need
		// generic information here, we need to check whether ANY such request is in progress.
		return Object.values( state.isFetchingCreateProfile ).some( Boolean );
	},

	/**
	 * Checks if profiles are being fetched for the given account and property.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} accountID  The Analytics Account ID to fetch profiles for.
	 * @param {string} propertyID The Analytics Property ID to check for profile fetching.
	 * @return {boolean} `true` if fetching a profiles, `false` if not.
	 */
	isDoingGetProfiles: createRegistrySelector(
		( select ) => ( state, accountID, propertyID ) => {
			return select( MODULES_ANALYTICS ).isFetchingGetProfiles(
				accountID,
				propertyID
			);
		}
	),
};

const store = Data.combineStores(
	fetchGetProfilesStore,
	fetchCreateProfileStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
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
