/**
 * modules/adsense data store: alerts.
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
import { isValidAccountID } from '../util';

// Actions
const FETCH_ALERTS = 'FETCH_ALERTS';
const START_FETCH_ALERTS = 'START_FETCH_ALERTS';
const FINISH_FETCH_ALERTS = 'FINISH_FETCH_ALERTS';
const CATCH_FETCH_ALERTS = 'CATCH_FETCH_ALERTS';

const RECEIVE_ALERTS = 'RECEIVE_ALERTS';
const RESET_ALERTS = 'RESET_ALERTS';

export const INITIAL_STATE = {
	isFetchingAlerts: {},
	alerts: {},
};

export const actions = {
	*fetchAlerts( accountID ) {
		invariant( accountID, 'accountID is required.' );

		let response, error;

		yield {
			payload: { accountID },
			type: START_FETCH_ALERTS,
		};

		try {
			response = yield {
				payload: { accountID },
				type: FETCH_ALERTS,
			};

			yield actions.receiveAlerts( response, { accountID } );

			yield {
				payload: { accountID },
				type: FINISH_FETCH_ALERTS,
			};
		} catch ( err ) {
			error = err;

			yield {
				payload: { error, accountID },
				type: CATCH_FETCH_ALERTS,
			};
		}

		return { response, error };
	},

	receiveAlerts( alerts, { accountID } ) {
		invariant( Array.isArray( alerts ), 'alerts must be an array.' );
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID, alerts },
			type: RECEIVE_ALERTS,
		};
	},

	*resetAlerts() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ALERTS,
		};

		return registry.stores[ STORE_NAME ].getActions()
			.invalidateResolutionForStoreSelector( 'getAlerts' );
	},
};

export const controls = {
	[ FETCH_ALERTS ]: ( { payload: { accountID } } ) => {
		return API.get( 'modules', 'adsense', 'alerts', { accountID }, {
			useCache: false,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_ALERTS: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingAlerts: {
					...state.isFetchingAlerts,
					[ accountID ]: true,
				},
			};
		}

		case RECEIVE_ALERTS: {
			const { accountID, alerts } = payload;

			return {
				...state,
				alerts: {
					...state.alerts,
					[ accountID ]: [ ...alerts ],
				},
			};
		}

		case FINISH_FETCH_ALERTS: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingAlerts: {
					...state.isFetchingAlerts,
					[ accountID ]: false,
				},
			};
		}

		case CATCH_FETCH_ALERTS: {
			const { accountID, error } = payload;

			return {
				...state,
				error,
				isFetchingAlerts: {
					...state.isFetchingAlerts,
					[ accountID ]: false,
				},
			};
		}

		case RESET_ALERTS: {
			return {
				...state,
				alerts: {},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getAlerts( accountID ) {
		if ( 'undefined' === typeof accountID || ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingAlerts = registry.select( STORE_NAME ).getAlerts( accountID );

		// If there are already alerts loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingAlerts ) {
			return;
		}

		yield actions.fetchAlerts( accountID );
	},
};

export const selectors = {
	/**
	 * Gets all Google AdSense alerts for this account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch alerts for.
	 * @return {?Array.<Object>} An array of AdSense alerts; `undefined` if not loaded.
	 */
	getAlerts( state, accountID ) {
		if ( 'undefined' === typeof accountID ) {
			return undefined;
		}

		const { alerts } = state;

		return alerts[ accountID ];
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
