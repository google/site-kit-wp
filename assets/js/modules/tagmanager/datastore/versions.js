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

// Actions
const FETCH_LIVE_CONTAINER_VERSION = 'FETCH_LIVE_CONTAINER_VERSION';
const START_FETCH_LIVE_CONTAINER_VERSION = 'START_FETCH_LIVE_CONTAINER_VERSION';
const FINISH_FETCH_LIVE_CONTAINER_VERSION = 'FINISH_FETCH_LIVE_CONTAINER_VERSION';
const CATCH_FETCH_LIVE_CONTAINER_VERSION = 'CATCH_FETCH_LIVE_CONTAINER_VERSION';

const RECEIVE_LIVE_CONTAINER_VERSION = 'RECEIVE_LIVE_CONTAINER_VERSION';

export const INITIAL_STATE = {
	isFetchingLiveContainerVersion: {},
	liveContainerVersions: {},
};

export const actions = {
	*fetchLiveContainerVersion( accountID, internalContainerID ) {
		invariant( isValidAccountID( accountID ), 'a valid accountID is required to fetch a live container version.' );
		invariant( isValidInternalContainerID( internalContainerID ), 'a valid accountID is required to fetch a live container version.' );

		let response, error;

		yield {
			payload: { accountID, internalContainerID },
			type: START_FETCH_LIVE_CONTAINER_VERSION,
		};

		try {
			response = yield {
				payload: { accountID, internalContainerID },
				type: FETCH_LIVE_CONTAINER_VERSION,
			};

			yield actions.receiveLiveContainerVersion( response, { accountID, internalContainerID } );

			yield {
				payload: { accountID, internalContainerID },
				type: FINISH_FETCH_LIVE_CONTAINER_VERSION,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					error,
					accountID,
					internalContainerID,
				},
				type: CATCH_FETCH_LIVE_CONTAINER_VERSION,
			};
		}

		return { response, error };
	},
	receiveLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } ) {
		return {
			payload: {
				liveContainerVersion,
				accountID,
				internalContainerID,
			},
			type: RECEIVE_LIVE_CONTAINER_VERSION,
		};
	},
};

export const controls = {
	[ FETCH_LIVE_CONTAINER_VERSION ]: ( { payload: { accountID, internalContainerID } } ) => {
		return API.get( 'modules', 'tagmanager', 'live-container-version', { accountID, internalContainerID } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_LIVE_CONTAINER_VERSION : {
			const { accountID, internalContainerID } = payload;
			return {
				...state,
				isFetchingLiveContainerVersion: {
					...state.isFetchingLiveContainerVersion,
					[ `${ accountID }::${ internalContainerID }` ]: true,
				},
			};
		}
		case FINISH_FETCH_LIVE_CONTAINER_VERSION : {
			const { accountID, internalContainerID } = payload;
			return {
				...state,
				isFetchingLiveContainerVersion: {
					...state.isFetchingLiveContainerVersion,
					[ `${ accountID }::${ internalContainerID }` ]: false,
				},
			};
		}
		case CATCH_FETCH_LIVE_CONTAINER_VERSION : {
			const { accountID, internalContainerID, error } = payload;
			return {
				...state,
				error,
				isFetchingLiveContainerVersion: {
					...state.isFetchingLiveContainerVersion,
					[ `${ accountID }::${ internalContainerID }` ]: false,
				},
			};
		}
		case RECEIVE_LIVE_CONTAINER_VERSION : {
			const { accountID, internalContainerID, liveContainerVersion } = payload;
			return {
				...state,
				liveContainerVersions: {
					...state.liveContainerVersions,
					[ `${ accountID }::${ internalContainerID }` ]: { ...liveContainerVersion },
				},
			};
		}

		default:
			return { ...state };
	}
};

export const resolvers = {
	*getLiveContainerVersion( accountID, internalContainerID ) {
		if ( ! isValidAccountID( accountID ) || ! isValidInternalContainerID( internalContainerID ) ) {
			return;
		}

		const { select } = yield Data.commonActions.getRegistry();

		if ( ! select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID ) ) {
			yield actions.fetchLiveContainerVersion( accountID, internalContainerID );
		}
	},
};

export const selectors = {
	/**
	 * Gets the live container version for the given account and container IDs.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} accountID Account ID the container belongs to.
	 * @param {string} internalContainerID Internal container ID to get version for.
	 * @return {(Object|undefined)} Live container version object, or `undefined` if not loaded yet.
	 */
	getLiveContainerVersion( state, accountID, internalContainerID ) {
		return state.liveContainerVersions[ `${ accountID }::${ internalContainerID }` ];
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
