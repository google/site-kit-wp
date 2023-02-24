/**
 * `core/forms` data store: forms data
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { isPlainObject } from 'lodash';

const SET_FORM_VALUES = 'SET_FORM_VALUES';

export const initialState = {};

export const actions = {
	/**
	 * Stores site form information.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {string} formName Name of the form.
	 * @param {Object} formData Form data supplied as a map of keys to set and their respective values.
	 * @return {Object} Redux-style action.
	 */
	setValues( formName, formData ) {
		invariant(
			formName && typeof formName === 'string',
			'a valid formName is required for setting values.'
		);
		invariant( isPlainObject( formData ), 'formData must be an object.' );

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
			return state;
		}
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the existing form by formName and key.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} formName Name of the form.
	 * @param {string} key      Get data stored in this key.
	 * @return {*} Value stored in state by formName and key. Returns `undefined` if formName or key isn't found.
	 */
	getValue( state, formName, key ) {
		const formData = state[ formName ] || {};

		return formData[ key ];
	},

	/**
	 * Checks whether a form with the given formName exists.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} formName Name of the form.
	 * @return {boolean} True if the form exists, false otherwise.
	 */
	hasForm( state, formName ) {
		return !! state[ formName ];
	},
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
