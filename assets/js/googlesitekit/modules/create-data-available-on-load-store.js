/**
 * Factory function to create data available on load store.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import Data from 'googlesitekit-data';

const RECEIVE_DATA_AVAILABLE_ON_LOAD = 'RECEIVE_DATA_AVAILABLE_ON_LOAD';
const SET_DATA_AVAILABLE_ON_LOAD = 'SET_DATA_AVAILABLE_ON_LOAD';

/**
 * Creates a store object that includes actions and selectors for data available state for a module.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string} moduleSlug Module slug.
 * @return {Object} The data available on load store object.
 */
const createDataAvailableOnLoadStore = ( moduleSlug ) => {
	invariant(
		'string' === typeof moduleSlug && moduleSlug,
		'module slug is required.'
	);

	const storeName = `modules/${ moduleSlug }`;

	const initialState = {
		dataAvailableOnLoad: undefined,
	};

	const actions = {
		/**
		 * Receives data available on load.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {boolean} dataAvailableOnLoad Data available on load.
		 * @return {Object} Redux-style action.
		 */
		receiveDataAvailableOnLoad( dataAvailableOnLoad ) {
			invariant(
				'boolean' === typeof dataAvailableOnLoad,
				'dataAvailableOnLoad must be a boolean.'
			);

			return {
				payload: {
					dataAvailableOnLoad,
				},
				type: RECEIVE_DATA_AVAILABLE_ON_LOAD,
			};
		},
		/**
		 * Sets data available on load.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} Redux-style action.
		 */
		setDataAvailableOnLoad() {
			return {
				payload: {},
				type: SET_DATA_AVAILABLE_ON_LOAD,
			};
		},
	};

	const controls = {
		[ SET_DATA_AVAILABLE_ON_LOAD ]: () =>
			API.set( 'modules', moduleSlug, 'data-available' ),
	};

	const reducer = ( state = initialState, { type, payload } ) => {
		switch ( type ) {
			case RECEIVE_DATA_AVAILABLE_ON_LOAD: {
				const { dataAvailableOnLoad } = payload;
				return {
					...state,
					dataAvailableOnLoad,
				};
			}

			default: {
				return state;
			}
		}
	};

	const resolvers = {
		*isDataAvailableOnLoad() {
			const registry = yield Data.commonActions.getRegistry();

			if (
				registry.select( storeName ).isDataAvailableOnLoad() !==
				undefined
			) {
				return;
			}

			if ( ! global._googlesitekitModulesData ) {
				global.console.error( 'Could not load modules data.' );
			}

			const dataAvailableOnLoad =
				global._googlesitekitModulesData[
					`data_available_${ moduleSlug }`
				];

			if ( dataAvailableOnLoad === undefined ) {
				global.console.error(
					`Could not load data available on load for ${ moduleSlug }.`
				);
			}

			yield actions.receiveDataAvailableOnLoad( dataAvailableOnLoad );
		},
	};

	const selectors = {
		/**
		 * Checks if data is available on load.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {(string|null|undefined)} The existing tag `string` if present, `null` if not present, or `undefined` if not loaded yet.
		 */
		isDataAvailableOnLoad( state ) {
			return state.dataAvailableOnLoad;
		},
	};

	return {
		initialState,
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
};

export default createDataAvailableOnLoadStore;
