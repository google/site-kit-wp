/**
 * core/forms data store
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import invariant from 'invariant';
import { STORE_NAME } from './constants';

export { STORE_NAME };

const SET_FORM_VALUES = 'SET_FORM_VALUES';

export const INITIAL_STATE = {};

export const actions = {
	/**
	 * Stores site form information.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} formName Name of the form.
	 * @param {Object} formData Form data supplied as a map of keys to set and their respective values.
	 * @return {Object} Redux-style action.
	 */
	setValues( formName, formData ) {
		invariant( formName, 'formName is required for setting values.' );
		invariant( formData instanceof Object && formData.constructor === Object, 'formData must be an object.' );

		return {
			payload: { formName, formData },
			type: SET_FORM_VALUES,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_FORM_VALUES: {
			const { formName, formData } = payload;

			return {
				...state,
				[ formName ]: { ...( state[ formName ] || {} ), ...formData },
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the existing form by formName and key.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} formName Name of the form.
	 * @param {string} key Key supplied from formData.
	 * @return {*} Value stored in state by formName and key or undefined.
	 */
	getValue( state, formName, key ) {
		const formData = state[ formName ] || {};

		return formData[ key ];
	},
};

const store = {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export default store;
