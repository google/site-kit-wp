/**
 * Factory function to create gathering data store.
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

const { createRegistryControl } = Data;

const RECEIVE_DATA_AVAILABLE_ON_LOAD = 'RECEIVE_DATA_AVAILABLE_ON_LOAD';
const SAVE_DATA_AVAILABLE_STATE = 'SAVE_DATA_AVAILABLE_STATE';
const SET_GATHERING_DATA = 'SET_GATHERING_DATA';
const WAIT_FOR_GATHERING_DATA = 'WAIT_FOR_GATHERING_DATA';
const POPULATE_GATHERING_DATA = 'POPULATE_GATHERING_DATA';

/**
 * Creates a store object that includes actions and selectors for gathering data state for a module.
 *
 * Since logic to determine data availability is different for every module,
 * individual modules must implement `determineDataAvailability` selector for this store to work.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {string} moduleSlug Module slug.
 * @return {Object} The gathering data store object.
 */
const createGatheringDataStore = ( moduleSlug ) => {
	invariant(
		'string' === typeof moduleSlug && moduleSlug,
		'module slug is required.'
	);

	const storeName = `modules/${ moduleSlug }`;

	const initialState = {
		dataAvailableOnLoad:
			global._googlesitekitModulesData?.[
				`data_available_${ moduleSlug }`
			],
		gatheringData: undefined,
	};

	const actions = {
		/**
		 * Receives data available on load state.
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
		 * Saves data available state to server.
		 *
		 * @since n.e.x.t
		 * @private
		 */
		*saveDataAvailableState() {
			yield {
				payload: {},
				type: SAVE_DATA_AVAILABLE_STATE,
			};
		},

		/**
		 * Waits for `determineDataAvailability` to resolve.
		 *
		 * @since n.e.x.t
		 * @private
		 */
		*waitForGatheringData() {
			yield {
				payload: {},
				type: WAIT_FOR_GATHERING_DATA,
			};
		},

		/**
		 * Populates gathering data state.
		 *
		 * @since n.e.x.t
		 * @private
		 */
		*populateGatheringData() {
			yield {
				payload: {},
				type: POPULATE_GATHERING_DATA,
			};
		},

		/**
		 * Sets gathering data state.
		 *
		 * @since n.e.x.t
		 * @private
		 *
		 * @param {boolean} gatheringData Gathering data state.
		 */
		*setGatheringData( gatheringData ) {
			invariant(
				typeof gatheringData === 'boolean',
				'gatheringData must be a boolean.'
			);

			yield {
				payload: { gatheringData },
				type: SET_GATHERING_DATA,
			};
		},
	};

	const controls = {
		[ SAVE_DATA_AVAILABLE_STATE ]: () =>
			API.set( 'modules', moduleSlug, 'data-available' ),

		[ WAIT_FOR_GATHERING_DATA ]: createRegistryControl(
			( registry ) => () => {
				const dataAvailabityDetermined = () =>
					registry.select( storeName ).determineDataAvailability() !==
					undefined;
				if ( dataAvailabityDetermined() ) {
					return true;
				}

				return new Promise( ( resolve ) => {
					const unsubscribe = registry.subscribe( () => {
						if ( dataAvailabityDetermined() ) {
							unsubscribe();
							resolve( true );
						}
					} );
				} );
			}
		),

		[ POPULATE_GATHERING_DATA ]: createRegistryControl(
			( registry ) => async () => {
				await registry.dispatch( storeName ).waitForGatheringData();
				const dataAvailable = registry
					.select( storeName )
					.determineDataAvailability();

				await registry
					.dispatch( storeName )
					.setGatheringData( ! dataAvailable );

				if ( dataAvailable ) {
					await registry
						.dispatch( storeName )
						.saveDataAvailableState();
				}
			}
		),
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

			case SET_GATHERING_DATA: {
				const { gatheringData } = payload;
				return {
					...state,
					gatheringData,
				};
			}

			default: {
				return state;
			}
		}
	};

	const resolvers = {
		*isGatheringData() {
			const registry = yield Data.commonActions.getRegistry();

			// If the gatheringData flag is already set, return early.
			if (
				registry.select( storeName ).isGatheringData() !== undefined
			) {
				return;
			}

			const dataAvailableOnLoad = registry
				.select( storeName )
				.isDataAvailableOnLoad();

			// If dataAvailableOnLoad is true, set gatheringData to false and do nothing else.
			if ( dataAvailableOnLoad ) {
				return {
					payload: {
						gatheringData: false,
					},
					type: SET_GATHERING_DATA,
				};
			}

			yield registry.dispatch( storeName ).populateGatheringData();
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

		/**
		 * Determines whether the Search Console is still gathering data or not.
		 *
		 * @todo Review the name of this selector to a less confusing one.
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean|undefined} Returns TRUE if gathering data, otherwise FALSE. If the request is still being resolved, returns undefined.
		 */
		isGatheringData( state ) {
			return state.gatheringData;
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

export default createGatheringDataStore;
