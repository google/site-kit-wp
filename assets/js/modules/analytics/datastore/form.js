/**
 * Analytics form datastore.
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

import invariant from 'invariant';

// Actions
const SET_FORM = 'SET_FORM';

export const INITIAL_STATE = {};

export const actions = {
	setForm( formID, data ) {
		invariant( formID, 'formID is required for updating data.' );
		invariant( typeof data === 'object', 'data must be an object to merge.' );

		return {
			payload: { formID, data },
			type: SET_FORM,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_FORM:
			const { formID, data } = payload;
			const formKey = `form::${ formID }`;

			return {
				...state,
				[ formKey ]: {
					...( state[ formKey ] || {} ),
					...data,
				},
			};
		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

export const selectors = {
	hasForm( state, formID ) {
		return !! state[ `form::${ formID }` ];
	},
	getForm( state, formID, key ) {
		const form = state[ `form::${ formID }` ] || {};

		return form[ key ];
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
