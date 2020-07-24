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
import { STORE_NAME, CONTEXT_WEB } from './constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
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
	 * Gets a unique list of Analytics property IDs for all effective containers based on current selections.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(string[]|undefined)} Array of unique property IDs, or `undefined` if not fully loaded.
	 */
	getAnalyticsPropertyIDs: createRegistrySelector( ( select ) => () => {
		const { isAMP, isSecondaryAMP } = select( CORE_SITE );
		const accountID = select( STORE_NAME ).getAccountID();

		if ( ! isValidAccountID( accountID ) ) {
			return [];
		}

		const propertyIDs = new Set;
		const internalContainerID = select( STORE_NAME ).getInternalContainerID();
		if ( ( ! isAMP() || isSecondaryAMP() ) && isValidInternalContainerID( internalContainerID ) ) {
			propertyIDs.add(
				select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID )
			);
		}

		const internalAMPContainerID = select( STORE_NAME ).getInternalAMPContainerID();
		if ( isAMP() && isValidInternalContainerID( internalAMPContainerID ) ) {
			propertyIDs.add(
				select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalAMPContainerID )
			);
		}

		// If either selector returned undefined, return undefined here as well.
		// We do this here to ensure resolvers are triggered for both.
		if ( propertyIDs.has( undefined ) ) {
			return undefined;
		}
		// At this point the set will only include valid property IDs or null,
		// so we ensure it isn't included in the result.
		propertyIDs.delete( null );

		return Array.from( propertyIDs );
	} ),

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
			const tagType = liveContainerVersion.container.usageContext[ 0 ] === CONTEXT_WEB ? 'ua' : 'ua_amp';
			return liveContainerVersion.tag.find( ( { type } ) => type === tagType ) || null;
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
	 * Checks if there are multiple unique Analytics property IDs for all effective containers based on current selections.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean|undefined)}
	 */
	hasMultipleAnalyticsPropertyIDs: createRegistrySelector( ( select ) => () => {
		const propertyIDs = select( STORE_NAME ).getAnalyticsPropertyIDs();

		if ( propertyIDs === undefined ) {
			return undefined;
		}

		return propertyIDs.length > 1;
	} ),

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
