/**
 * core/user Data store: user info
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
// import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';

const { createRegistrySelector } = Data;

const RECEIVE_USER_DATA = 'RECEIVE_USER_DATA';

const INITIAL_STATE = {
	user: undefined,
	verified: undefined,
};

export const actions = {};
export const controls = {};
export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_USER_DATA: {
			const { user, verified } = payload;

			return {
				...state,
				user,
				verified,
			};
		}
		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getUser() {
		let error;

		const response = yield {
			payload: { ...global._googlesitekitUserData },
			type: RECEIVE_USER_DATA,
		};
		return { response, error };
	},
};

export const selectors = {
	/**
	 * Gets the user info for the logged in user.
	 *
	 * Returns `undefined` if the user info is not available/loaded.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 * user: <Object>,
	 * verified: <Boolean>,
	 * }
	 * ```
	 *
	 * @private
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User info.
	 */
	getUser( state ) {
		const { user, verified } = state;
		return { user, verified };
	},

	/**
	 * Gets the ID for this user.
	 *
	 * Returns ID of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|undefined)} The user ID.
	 */
	getID: createRegistrySelector( ( select ) => () => {
		const { user: { id } } = select( STORE_NAME ).getUser() || {};
		return id;
	} ),

	/**
	 * Gets the Name for this user.
	 *
	 * Returns Name of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The user ID.
	 */
	getName: createRegistrySelector( ( select ) => () => {
		const { user: { name } } = select( STORE_NAME ).getUser() || {};
		return name;
	} ),

	/**
	 * Gets the Email for this user.
	 *
	 * Returns email of the user or `undefined` if the user info is not available/loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The user ID.
	 */
	getEmail: createRegistrySelector( ( select ) => () => {
		const { user: { email } } = select( STORE_NAME ).getUser() || {};
		return email;
	} ),

	/**
	 * Gets the url to the picture for this user.
	 *
	 * Returns url of the user picture or `undefined` if the user info is not available/loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The user ID.
	 */
	getPicture: createRegistrySelector( ( select ) => () => {
		const { user: { picture } } = select( STORE_NAME ).getUser() || {};
		return picture;
	} ),

	/**
	 * Gets the Email for this user.
	 *
	 * Returns the true if the user is verified, false if not verified, or `undefined` if the user info is not available/loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} The user ID.
	 */
	isVerified: createRegistrySelector( ( select ) => () => {
		const { verified } = select( STORE_NAME ).getUser() || {};
		return verified;
	} ),

};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
