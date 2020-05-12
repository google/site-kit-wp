/**
 * core/user Data store: error
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

export const INITIAL_STATE = { error: undefined };
export const actions = {};
export const controls = {};
export const reducer = ( state ) => {
	return { ...state };
};
export const resolvers = {};
export const selectors = {
	/**
	 * Retrieve the error object from state.
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
