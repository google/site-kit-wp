/**
 * Provides API functions to create a datastore for module inline data.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createRegistrySelector } from 'googlesitekit-data';
import { camelCaseToPascalCase } from './transform-case';

const RECEIVE_MODULE_DATA = 'RECEIVE_MODULE_DATA';

function getModuleDataProperty( propName, store ) {
	return createRegistrySelector( ( select ) => () => {
		const moduleData = select( store ).getModuleData() || [];
		return moduleData[ propName ];
	} );
}

export const createModuleDataStore = ( {
	moduleSlug,
	storeName: STORE_NAME,
	inlineDataProperties = [],
} ) => {
	invariant( moduleSlug, 'moduleSlug is required.' );
	invariant(
		'string' === typeof STORE_NAME && STORE_NAME,
		'storeName is required.'
	);

	const moduleData = {};

	for ( const property of inlineDataProperties ) {
		moduleData[ property ] = undefined;
	}

	const initialState = {
		moduleData,
	};

	const actions = {
		/**
		 * Stores module data in the datastore.
		 *
		 * Because this is frequently-accessed data, this is usually sourced
		 * from a global variable (`_googlesitekitModulesData`), set by PHP.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Object} data Module data, usually supplied via a global variable from PHP.
		 * @return {Object} Redux-style action.
		 */
		receiveModuleData( data ) {
			invariant( data, 'data is required.' );

			return {
				payload: data,
				type: RECEIVE_MODULE_DATA,
			};
		},
	};

	const controls = {};

	const reducer = ( state = initialState, { type, payload } ) => {
		switch ( type ) {
			case RECEIVE_MODULE_DATA: {
				const data = {};

				for ( const property of inlineDataProperties ) {
					data[ property ] = payload?.[ property ];
				}

				return {
					...state,
					moduleData: data,
				};
			}

			default: {
				return state;
			}
		}
	};

	const resolvers = {
		*getModuleData() {
			const data = global._googlesitekitModulesData?.[ moduleSlug ];

			if ( ! data ) {
				return;
			}

			yield actions.receiveModuleData( data );
		},
	};

	const selectors = {
		/**
		 * Gets all site info from this data store.
		 *
		 * Not intended to be used publicly; this is largely here so other selectors can
		 * request data using the selector/resolver pattern.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {Object} state Data store's state.
		 * @return {(Object|undefined)} Module data.
		 */
		getModuleData( state ) {
			return state.moduleData;
		},
	};

	for ( const property of inlineDataProperties ) {
		const pascalCaseSlug = camelCaseToPascalCase( property );

		/**
		 * Gets inline data value indicated by the selector name.
		 *
		 * @since n.e.x.t
		 *
		 * @return {*} Module data value, or undefined.
		 */
		selectors[ `get${ pascalCaseSlug }` ] = getModuleDataProperty(
			property,
			STORE_NAME
		);
	}

	const store = {
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};

	return {
		...store,
		STORE_NAME,
	};
};
