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
import { isValidPropertyID } from '../../analytics/util';
const { createRegistrySelector } = Data;

const fetchGetLiveContainerVersionStore = createFetchStore( {
	baseName: 'getLiveContainerVersion',
	argsToParams: ( accountID, internalContainerID ) => {
		invariant( isValidAccountID( accountID ), 'A valid accountID is required to fetch or receive a live container version.' );
		invariant( isValidInternalContainerID( internalContainerID ), 'A valid accountID is required to fetch or receive a live container version.' );

		return { accountID, internalContainerID };
	},
	controlCallback: async ( { accountID, internalContainerID } ) => {
		try {
			return await API.get( 'modules', 'tagmanager', 'live-container-version', { accountID, internalContainerID }, { useCache: false } );
		} catch ( err ) {
			// If the container has no published version, it will error with a 404.
			if ( 404 === err.code ) {
				return null;
			}
			// Otherwise rethrow the error to be handled as usual.
			throw err;
		}
	},
	reducerCallback: ( state, liveContainerVersion, { accountID, internalContainerID } ) => {
		return {
			...state,
			liveContainerVersions: {
				...state.liveContainerVersions,
				[ `${ accountID }::${ internalContainerID }` ]: liveContainerVersion,
			},
		};
	},
} );

const BASE_INITIAL_STATE = {
	liveContainerVersions: {},
};

const baseResolvers = {
	*getLiveContainerVersion( accountID, internalContainerID ) {
		if ( ! isValidAccountID( accountID ) || ! isValidInternalContainerID( internalContainerID ) ) {
			return;
		}

		const { select } = yield Data.commonActions.getRegistry();

		if ( undefined === select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID ) ) {
			yield fetchGetLiveContainerVersionStore.actions.fetchGetLiveContainerVersion( accountID, internalContainerID );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the live container Universal Analytics property ID for the given account and container ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get the Analytics tag for.
	 * @return {(string|null|undefined)} Analytics property ID if present and valid, `null` if none exists or not valid, or `undefined` if not loaded yet.
	 */
	getLiveContainerAnalyticsPropertyID: createRegistrySelector( ( select ) => ( state, accountID, internalContainerID ) => {
		const analyticsTag = select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID );

		if ( analyticsTag === undefined ) {
			return undefined;
		}

		if ( analyticsTag?.parameter ) {
			// Check if property ID is provided directly on the tag first.
			let propertyID = analyticsTag.parameter.find( ( { key } ) => key === 'trackingId' )?.value;
			// If not, check if there is a gaSettings variable referenced.
			if ( ! propertyID ) {
				propertyID = analyticsTag.parameter.find( ( { key } ) => key === 'gaSettings' )?.value;
			}
			// If the propertyID is a variable, parse out the name and look up its value.
			if ( propertyID?.startsWith( '{{' ) ) {
				propertyID = propertyID.replace( /(\{\{|\}\})/g, '' );
				const gaSettingsVariable = select( STORE_NAME ).getLiveContainerVariable( accountID, internalContainerID, propertyID );
				propertyID = gaSettingsVariable?.parameter.find( ( { key } ) => key === 'trackingId' )?.value;
			}
			// Finally, check that whatever was found is a valid ID.
			if ( isValidPropertyID( propertyID ) ) {
				return propertyID;
			}
		}

		return null;
	} ),

	/**
	 * Gets the live container Universal Analytics tag object for the given account and container ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get the Analytics tag for.
	 * @return {(Object|null|undefined)} Live container Universal Analytics tag object, `null` if none exists, or `undefined` if not loaded yet.
	 */
	getLiveContainerAnalyticsTag: createRegistrySelector( ( select ) => ( state, accountID, internalContainerID ) => {
		const liveContainerVersion = select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

		if ( liveContainerVersion === undefined ) {
			return undefined;
		}

		if ( liveContainerVersion?.tag ) {
			return liveContainerVersion.tag.find( ( { type } ) => type === 'ua' ) || null;
		}

		return null;
	} ),

	/**
	 * Gets the live container variable object by the given name for the given account and container ID.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @param {string} variableName        Variable name to retrive.
	 * @return {(Object|null|undefined)} Live container version object, `null` if none exists, or `undefined` if not loaded yet.
	 */
	getLiveContainerVariable: createRegistrySelector( ( select ) => ( state, accountID, internalContainerID, variableName ) => {
		const liveContainerVersion = select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

		if ( liveContainerVersion === undefined ) {
			return undefined;
		}

		if ( liveContainerVersion?.variable ) {
			return liveContainerVersion.variable.find( ( { name } ) => name === variableName ) || null;
		}

		return null;
	} ),

	/**
	 * Gets the live container version for the given account and container IDs.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state               Data store's state.
	 * @param {string} accountID           Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @return {(Object|null|undefined)} Live container version object, `null` if none exists, or `undefined` if not loaded yet.
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
		INITIAL_STATE: BASE_INITIAL_STATE,
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
