/**
 * modules/tagmanager data store: versions.
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
import { STORE_NAME } from './constants';
import { isValidAccountID, isValidInternalContainerID } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistrySelector } = Data;

const fetchGetLiveContainerVersionStore = createFetchStore( {
	baseName: 'getLiveContainerVersion',
	argsToParams: ( accountID, internalContainerID ) => {
		return { accountID, internalContainerID };
	},
	validateParams: ( { accountID, internalContainerID } = {} ) => {
		invariant( isValidAccountID( accountID ), 'A valid accountID is required to fetch or receive a live container version.' );
		invariant( isValidInternalContainerID( internalContainerID ), 'A valid internalContainerID is required to fetch or receive a live container version.' );
	},
	controlCallback: ( { accountID, internalContainerID } ) => {
		return API.get( 'modules', 'tagmanager', 'live-container-version', { accountID, internalContainerID }, { useCache: false } );
	},
	reducerCallback: ( state, liveContainerVersion, { accountID, internalContainerID } ) => {
		return {
			...state,
			liveContainerVersions: {
				...state.liveContainerVersions,
				[ `${ accountID }::${ internalContainerID }` ]: { ...liveContainerVersion },
			},
		};
	},
} );

const baseInitialState = {
	liveContainerVersions: {},
};

const baseResolvers = {
	*getLiveContainerVersion( accountID, internalContainerID ) {
		if ( ! isValidAccountID( accountID ) || ! isValidInternalContainerID( internalContainerID ) ) {
			return;
		}

		const { select } = yield Data.commonActions.getRegistry();

		if ( ! select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID ) ) {
			yield fetchGetLiveContainerVersionStore.actions.fetchGetLiveContainerVersion( accountID, internalContainerID );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the live container version for the given account and container IDs.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @return {(Object|undefined)} Live container version object, or `undefined` if not loaded yet.
	 */
	getLiveContainerVersion( state, accountID, internalContainerID ) {
		return state.liveContainerVersions[ `${ accountID }::${ internalContainerID }` ];
	},

	/**
	 * Checks whether or not the live container version is being fetched for the given account and container IDs.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @return {(boolean|undefined)} True if the live container version is being fetched, otherwise false.
	 */
	isDoingGetLiveContainerVersion: createRegistrySelector( ( select ) => ( state, accountID, internalContainerID ) => {
		return select( STORE_NAME ).isFetchingGetLiveContainerVersion( accountID, internalContainerID );
	} ),
};

const store = Data.combineStores(
	fetchGetLiveContainerVersionStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
