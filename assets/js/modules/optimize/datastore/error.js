/**
 * modules/optimize Data store: error
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

// Actions.
const RECEIVE_ERROR = 'RECEIVE_ERROR';

export const INITIAL_STATE = { error: undefined };

export const actions = {
	receiveError( error ) {
		return {
			type: RECEIVE_ERROR,
			payload: { error },
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	if ( RECEIVE_ERROR === type ) {
		const { error } = payload;
		return {
			...state,
			error,
		};
	}
	return { ...state };
};

export const resolvers = {};

export const selectors = {
	/**
	 * Retrieves the error object from state.
	 *
	 * Returns `undefined` if there is no error set.
	 *```
	 * {
	 *   code: <String>,
	 *   message: <String>,
	 *   data: <Object>
	 * }
	 * ```
	 *
	 * @since 1.10.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Error object.
	 */
	getError( state ) {
		const { error } = state;
		return error;
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
