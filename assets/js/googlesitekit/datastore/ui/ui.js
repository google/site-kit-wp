/**
 * `core/ui` data store: ui data
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
import isPlainObject from 'lodash/isPlainObject';

const SET_UI_VALUES = 'SET_UI_VALUES';
const SET_UI_VALUE = 'SET_UI_VALUE';

export const initialState = {};

export const actions = {
	/**
	 * Stores site ui information.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} values Ui data supplied as a map of keys to set and their respective values.
	 * @return {Object} Redux-style action.
	 */
	setValues( values ) {
		invariant( isPlainObject( values ), 'formData must be an object.' );

		return {
			payload: { values },
			type: SET_UI_VALUES,
		};
	},

	/**
	 * Sets a particular value for a key.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {string} key   Ui key to set the value for.
	 * @param {string} value The value for the key.
	 * @return {Object} Redux-style action.
	 */
	setValue( key, value ) {
		invariant( key, 'key is required.' );
		invariant( value, 'value is required.' );

		return {
			payload: { key, value },
			type: SET_UI_VALUE,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_UI_VALUES: {
			const { values } = payload;

			return {
				...state,
				...values,
			};
		}

		case SET_UI_VALUE: {
			const { key, value } = payload;

			return {
				...state,
				[ key ]: { ...( state[ key ] || {} ), value },
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
	 * @param {Object} state Data store's state.
	 * @param {string} key   Get data stored in this key.
	 * @return {*} Value stored in state by key. Returns `undefined` if key isn't found.
	 */
	getValue( state, key ) {
		return state[ key ];
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
