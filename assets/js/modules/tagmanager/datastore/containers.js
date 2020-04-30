/**
 * modules/analytics data store: containers.
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
import { isValidAccountID, isValidUsageContext } from '../util/validation';

// Actions
const FETCH_CONTAINERS = 'FETCH_CONTAINERS';
const START_FETCH_CONTAINERS = 'START_FETCH_CONTAINERS';
const FINISH_FETCH_CONTAINERS = 'FINISH_FETCH_CONTAINERS';
const CATCH_FETCH_CONTAINERS = 'CATCH_FETCH_CONTAINERS';

const FETCH_CREATE_CONTAINER = 'FETCH_CREATE_CONTAINER';
const START_FETCH_CREATE_CONTAINER = 'START_FETCH_CREATE_CONTAINER';
const FINISH_FETCH_CREATE_CONTAINER = 'FINISH_FETCH_CREATE_CONTAINER';
const CATCH_FETCH_CREATE_CONTAINER = 'CATCH_FETCH_CREATE_CONTAINER';

const RECEIVE_CONTAINERS = 'RECEIVE_CONTAINERS';
const RECEIVE_CREATE_CONTAINER = 'RECEIVE_CREATE_CONTAINER';

export const INITIAL_STATE = {
	containers: {},
	isFetchingContainers: {},
	isFetchingCreateContainer: {},
};

export const actions = {
	*createContainer( accountID, usageContext ) {
		invariant( isValidAccountID( accountID ), 'a valid accountID is required to create a container.' );
		invariant( isValidUsageContext( usageContext ), 'a valid usageContext is required to create a container.' );
		let response, error;

		yield {
			payload: { accountID, usageContext },
			type: START_FETCH_CREATE_CONTAINER,
		};

		try {
			response = yield {
				payload: { accountID, usageContext },
				type: FETCH_CREATE_CONTAINER,
			};

			yield actions.receiveCreateContainer( response, { accountID, usageContext } );

			yield {
				payload: { accountID, usageContext },
				type: FINISH_FETCH_CREATE_CONTAINER,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					error,
					accountID,
					usageContext,
				},
				type: CATCH_FETCH_CREATE_CONTAINER,
			};
		}
		return { response, error };
	},
	*fetchContainers( accountID ) {
		invariant( isValidAccountID( accountID ), 'a valid accountID is required to fetch containers.' );
		let response, error;

		yield {
			payload: { accountID },
			type: START_FETCH_CONTAINERS,
		};

		try {
			response = yield {
				payload: { accountID },
				type: FETCH_CONTAINERS,
			};

			yield actions.receiveContainers( response, { accountID } );

			yield {
				payload: { accountID },
				type: FINISH_FETCH_CONTAINERS,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: {
					error,
					accountID,
				},
				type: CATCH_FETCH_CONTAINERS,
			};
		}

		return { response, error };
	},
	receiveContainers( containers, { accountID } ) {
		invariant( Array.isArray( containers ), 'containers must be an array.' );
		invariant( isValidAccountID( accountID ), 'a valid accountID is required.' );

		return {
			payload: { containers, accountID },
			type: RECEIVE_CONTAINERS,
		};
	},
	receiveCreateContainer( container, { accountID, usageContext } ) {
		invariant( container, 'container is required.' );
		invariant( isValidAccountID( accountID ), 'a valid accountID is required.' );
		invariant( isValidUsageContext( usageContext ), 'a valid usageContext is required.' );

		return {
			payload: { container, accountID, usageContext },
			type: RECEIVE_CREATE_CONTAINER,
		};
	},
};

export const controls = {
	[ FETCH_CONTAINERS ]: ( { payload: { accountID } } ) => {
		return API.get( 'modules', 'tagmanager', 'containers', { accountID } );
	},
	[ FETCH_CREATE_CONTAINER ]: ( { payload: { accountID, usageContext } } ) => {
		return API.set( 'modules', 'tagmanager', 'create-container', { accountID, usageContext } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_CONTAINERS: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingContainers: {
					...state.isFetchingContainers,
					[ accountID ]: true,
				},
			};
		}

		case RECEIVE_CONTAINERS: {
			const { containers, accountID } = payload;

			return {
				...state,
				containers: {
					...state.containers,
					[ accountID ]: [ ...containers ],
				},
			};
		}

		case FINISH_FETCH_CONTAINERS: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingContainers: {
					...state.isFetchingContainers,
					[ accountID ]: true,
				},
			};
		}

		case CATCH_FETCH_CONTAINERS: {
			const { error, accountID } = payload;

			return {
				...state,
				error,
				isFetchingContainers: {
					...state.isFetchingContainers,
					[ accountID ]: true,
				},
			};
		}

		case START_FETCH_CREATE_CONTAINER: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingCreateContainer: {
					...state.isFetchingCreateContainer,
					[ accountID ]: true,
				},
			};
		}

		case RECEIVE_CREATE_CONTAINER: {
			const { container, accountID } = payload;

			return {
				...state,
				containers: {
					...state.containers,
					[ accountID ]: ( state.containers[ accountID ] || [] ).concat( container ),
				},
			};
		}

		case FINISH_FETCH_CREATE_CONTAINER: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingCreateContainer: {
					...state.isFetchingCreateContainer,
					[ accountID ]: false,
				},
			};
		}

		case CATCH_FETCH_CREATE_CONTAINER: {
			const { error, accountID } = payload;

			return {
				...state,
				error,
				isFetchingCreateContainer: {
					...state.isFetchingCreateContainer,
					[ accountID ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getContainers( accountID ) {
		const { select } = yield Data.commonActions.getRegistry();

		if ( ! select( STORE_NAME ).getContainers( accountID ) ) {
			yield actions.fetchContainers( accountID );
		}
	},
};

export const selectors = {
	/**
	 * Gets the containers for a given account.
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} accountID Account ID to get containers for.
	 * @param {string} [usageContext] Usage context of containers to filter by.
	 * @return {(Array|undefined)} Array of containers, or `undefined` if not loaded yet.
	 */
	getContainers( state, accountID, usageContext ) {
		const containers = state.containers[ accountID ];

		if ( containers && usageContext ) {
			return containers.filter( ( container ) => container.usageContext.includes( usageContext ) );
		}

		return containers;
	},
	isDoingCreateContainer( state, accountID ) {
		return !! state.isFetchingCreateContainer[ accountID ];
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
