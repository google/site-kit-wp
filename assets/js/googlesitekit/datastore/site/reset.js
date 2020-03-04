/**
 * core/site data store: reset connection.
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
import { initializeAction } from 'assets/js/googlesitekit/data/utils';

// Actions
const FETCH_RESET = 'FETCH_RESET';
const RECEIVE_RESET = 'RECEIVE_RESET';
const RECEIVE_RESET_FAILURE = 'RECEIVE_RESET_FAILURE';

export const INITIAL_STATE = {
	isDoingReset: false,
};

export const actions = {
	fetchReset() {
		return {
			payload: {},
			type: FETCH_RESET,
		};
	},

	receiveReset() {
		return {
			payload: {},
			type: RECEIVE_RESET,
		};
	},

	receiveResetFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_RESET_FAILURE,
		};
	},

	*reset() {
		try {
			yield actions.fetchReset();
			yield actions.receiveReset();
			return initializeAction();
		} catch ( err ) {
			return actions.receiveResetFailed( err );
		}
	},
};

export const controls = {
	[ FETCH_RESET ]: () => {
		return API.set( 'core', 'site', 'reset' );
	},
};

export const reducer = ( state, action ) => {
	switch ( action.type ) {
		case FETCH_RESET: {
			return {
				...state,
				isDoingReset: true,
			};
		}

		case RECEIVE_RESET_FAILURE: {
			const { error } = action.payload;
			return {
				...state,
				resetError: error,
				isDoingReset: false,
			};
		}

		case RECEIVE_RESET: {
			return { ...INITIAL_STATE };
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

export const selectors = {
	isDoingReset: ( state ) => {
		const { isDoingReset } = state;

		return isDoingReset;
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
