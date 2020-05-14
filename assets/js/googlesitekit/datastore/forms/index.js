/**
 * core/forms Data store: values
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
import Data from 'googlesitekit-data';
import invariant from 'invariant';
import { STORE_NAME } from './constants';

// Actions
const SET_FORM_VALUES = 'SET_FORM_VALUES';

export { STORE_NAME };

export const INITIAL_STATE = {
};

export const actions = {
	setValues( formName, formData ) {
		invariant( formName, 'form name is required.' );

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
				[ formName ]: formData,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

export const selectors = {
	getValue( state, formName, key ) {
		if ( ! formName ) {
			return undefined;
		}
		if ( ! key ) {
			return undefined;
		}

		return state[ formName ][ key ];
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
