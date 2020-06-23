/**
 * modules/tagmanager data store: containers.
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
import { STORE_NAME, CONTEXT_WEB, CONTEXT_AMP } from './constants';
import { isValidAccountID, isValidUsageContext } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistrySelector } = Data;

const fetchGetContainersStore = createFetchStore( {
	baseName: 'getContainers',
	argsToParams: ( accountID ) => {
		invariant( isValidAccountID( accountID ), 'A valid accountID is required to fetch containers.' );

		return { accountID };
	},
	controlCallback: ( { accountID } ) => {
		// Always request both contexts to prevent filtering on server.
		// TODO: Remove `usageContext` param when legacy component is removed and datapoint
		// defaults to returning all containers if no context is provided.
		const usageContext = [ CONTEXT_WEB, CONTEXT_AMP ];
		return API.get( 'modules', 'tagmanager', 'containers', { accountID, usageContext }, { useCache: false } );
	},
	reducerCallback: ( state, containers, { accountID } ) => {
		return {
			...state,
			containers: {
				...state.containers,
				[ accountID ]: [ ...containers ],
			},
		};
	},
} );

const fetchCreateContainerStore = createFetchStore( {
	baseName: 'createContainer',
	argsToParams( accountID, usageContext ) {
		invariant( isValidAccountID( accountID ), 'A valid accountID is required to create a container.' );
		invariant( isValidUsageContext( usageContext ), 'A valid usageContext is required to create a container.' );

		return { accountID, usageContext };
	},
	controlCallback: ( { accountID, usageContext } ) => {
		return API.set( 'modules', 'tagmanager', 'create-container', { accountID, usageContext } );
	},
	reducerCallback( state, container, { accountID } ) {
		return {
			...state,
			containers: {
				...state.containers,
				[ accountID ]: [
					...( state.containers[ accountID ] || [] ),
					container,
				],
			},
		};
	},
} );

const BASE_INITIAL_STATE = {
	containers: {},
};

const baseActions = {
	/**
	 * Creates a new Tag Manager container in the given account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} accountID    Google Tag Manager account ID.
	 * @param {string} usageContext Container usage context. (Either 'web', or 'amp')
	 * @return {Object} Object with `response` and `error`.
	 */
	*createContainer( accountID, usageContext ) {
		invariant( isValidAccountID( accountID ), 'A valid accountID is required to create a container.' );
		invariant( isValidUsageContext( usageContext ), 'A valid usageContext is required to create a container.' );

		const { response, error } = yield fetchCreateContainerStore.actions.fetchCreateContainer( accountID, usageContext );

		return { response, error };
	},
};

const baseResolvers = {
	*getContainers( accountID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		const { select } = yield Data.commonActions.getRegistry();

		if ( ! select( STORE_NAME ).getContainers( accountID ) ) {
			yield fetchGetContainersStore.actions.fetchGetContainers( accountID );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all web containers for the given account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID Account ID to get containers for.
	 * @return {(Array|undefined)} Array of containers, or `undefined` if not loaded yet.
	 */
	getWebContainers: createRegistrySelector( ( select ) => ( state, accountID ) => {
		const containers = select( STORE_NAME ).getContainers( accountID );

		if ( ! Array.isArray( containers ) ) {
			return undefined;
		}

		return containers.filter(
			( { usageContext } ) => usageContext.includes( CONTEXT_WEB )
		);
	} ),

	/**
	 * Gets all AMP containers for the given account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID Account ID to get containers for.
	 * @return {(Array|undefined)} Array of containers, or `undefined` if not loaded yet.
	 */
	getAMPContainers: createRegistrySelector( ( select ) => ( state, accountID ) => {
		const containers = select( STORE_NAME ).getContainers( accountID );

		if ( ! Array.isArray( containers ) ) {
			return undefined;
		}

		return containers.filter(
			( { usageContext } ) => usageContext.includes( CONTEXT_AMP )
		);
	} ),

	/**
	 * Gets all containers for the given account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID Account ID to get containers for.
	 * @return {(Array|undefined)} Array of containers, or `undefined` if not loaded yet.
	 */
	getContainers( state, accountID ) {
		return state.containers[ accountID ];
	},

	/**
	 * Checks if containers are currently being fetched for the given account or not.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID Account ID to get containers for.
	 * @return {boolean} True if containers are being fetched for the given account, otherwise false.
	 */
	isDoingGetContainers: createRegistrySelector( ( select ) => ( state, accountID ) => {
		return select( STORE_NAME ).isFetchingGetContainers( accountID );
	} ),

	/**
	 * Checks if any request for creating a container is in progress.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if a request for create-container is in progress, otherwise false.
	 */
	isDoingCreateContainer( state ) {
		return Object.values( state.isFetchingCreateContainer ).some( Boolean );
	},
};

const store = Data.combineStores(
	fetchGetContainersStore,
	fetchCreateContainerStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
