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
import { STORE_NAME } from './constants';
import { isValidAccountID } from '../util';

// Actions
const FETCH_ALERTS = 'FETCH_ALERTS';
const RECEIVE_ALERTS = 'RECEIVE_ALERTS';
const RECEIVE_ALERTS_SUCCEEDED = 'RECEIVE_ALERTS_SUCCEEDED';
const RECEIVE_ALERTS_FAILED = 'RECEIVE_ALERTS_FAILED';
const RESET_ALERTS = 'RESET_ALERTS';

export const INITIAL_STATE = {
	isFetchingAlerts: {},
	alerts: {},
};

export const actions = {
	fetchAlerts( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID },
			type: FETCH_ALERTS,
		};
	},

	/**
	 * Adds alerts to the store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Array} alerts Alerts to add.
	 * @return {Object} Redux-style action.
	 */
	receiveAlerts( { accountID, alerts } ) {
		invariant( Array.isArray( alerts ), 'alerts must be an array.' );
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID, alerts },
			type: RECEIVE_ALERTS,
		};
	},

	receiveAlertsSucceeded( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID },
			type: RECEIVE_ALERTS_SUCCEEDED,
		};
	},

	receiveAlertsFailed( { accountID, error } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( error, 'error is required.' );

		return {
			payload: { accountID, error },
			type: RECEIVE_ALERTS_FAILED,
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
		return API.get( 'modules', 'adsense', 'alerts', { accountID } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_ALERTS: {
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

		case RECEIVE_ALERTS_SUCCEEDED: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingAlerts: {
					...state.isFetchingAlerts,
					[ accountID ]: false,
				},
			};
		}

		case RECEIVE_ALERTS_FAILED: {
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
			return undefined;
		}
		try {
			const registry = yield Data.commonActions.getRegistry();
			const existingAlerts = registry.select( STORE_NAME ).getAlerts( accountID );

			// If there are already alerts loaded in state, consider it fulfilled
			// and don't make an API request.
			if ( existingAlerts ) {
				return;
			}

			const alerts = yield actions.fetchAlerts( accountID );

			yield actions.receiveAlerts( { accountID, alerts } );

			return yield actions.receiveAlertsSucceeded( accountID );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveAlertsFailed( { accountID, error } );
		}
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
