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
import { createFetchStore } from '../data/create-fetch-store';
import { actions as errorStoreActions } from '../data/create-error-store';

const { receiveError } = errorStoreActions;

const { createRegistryControl } = Data;

const RECEIVE_GATHERING_DATA = 'RECEIVE_GATHERING_DATA';
const WAIT_FOR_DATA_AVAILABILITY_STATE = 'WAIT_FOR_DATA_AVAILABILITY_STATE';

/**
 * Creates a store object that includes actions and selectors for gathering data state for a module.
 *
 * @since 1.96.0
 * @private
 *
 * @param {string}   moduleSlug                  Slug of the module that the store is for.
 * @param {Object}   args                        Arguments to configure the store.
 * @param {string}   args.storeName              Store name to use.
 * @param {boolean}  args.dataAvailable          Data available on load.
 * @param {Function} args.selectDataAvailability Selector to determine data availability.
 *                                               This is a function that should return a boolean, or undefined while resolving.
 *                                               Since logic to determine data availability is different for every module,
 *                                               this selector must be provided by the module. If the data availability can
 *                                               not be determined, the selector should return null.
 * @return {Object} The gathering data store object.
 */
export const createGatheringDataStore = (
	moduleSlug,
	{ storeName, dataAvailable = false, selectDataAvailability } = {}
) => {
	invariant(
		'string' === typeof moduleSlug && moduleSlug,
		'module slug is required.'
	);

	invariant(
		'string' === typeof storeName && storeName,
		'store name is required.'
	);

	invariant(
		'boolean' === typeof dataAvailable,
		'dataAvailable must be a boolean.'
	);

	invariant(
		'function' === typeof selectDataAvailability,
		'selectDataAvailability must be a function.'
	);

	const fetchSaveDataAvailableStateStore = createFetchStore( {
		baseName: 'saveDataAvailableState',
		controlCallback: () =>
			API.set( 'modules', moduleSlug, 'data-available' ),
	} );

	const initialState = {
		dataAvailableOnLoad: dataAvailable,
		gatheringData: undefined,
	};

	const actions = {
		/**
		 * Receives gathering data state.
		 *
		 * @since 1.96.0
		 * @private
		 *
		 * @param {boolean} gatheringData Gathering data.
		 * @return {Object} Redux-style action.
		 */
		receiveIsGatheringData( gatheringData ) {
			invariant(
				'boolean' === typeof gatheringData,
				'gatheringData must be a boolean.'
			);

			return {
				payload: {
					gatheringData,
				},
				type: RECEIVE_GATHERING_DATA,
			};
		},
	};

	const controls = {
		[ WAIT_FOR_DATA_AVAILABILITY_STATE ]: createRegistryControl(
			( registry ) => () => {
				const dataAvailabityDetermined = () =>
					registry.select( storeName ).selectDataAvailability() !==
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
	};

	const reducer = ( state = initialState, { type, payload } ) => {
		switch ( type ) {
			case RECEIVE_GATHERING_DATA: {
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
				yield actions.receiveIsGatheringData( false );
				return;
			}

			yield {
				payload: {},
				type: WAIT_FOR_DATA_AVAILABILITY_STATE,
			};

			const dataAvailability = registry
				.select( storeName )
				.selectDataAvailability();

			yield actions.receiveIsGatheringData( ! dataAvailability );

			if ( dataAvailability === null ) {
				yield receiveError(
					{ message: 'Unable to determine gathering data state.' },
					'isGatheringData',
					[]
				);
			}

			if ( dataAvailability ) {
				yield fetchSaveDataAvailableStateStore.actions.fetchSaveDataAvailableState();
			}
		},
	};

	const selectors = {
		/**
		 * Determines whether data is available for the module.
		 *
		 * @since 1.96.0
		 * @since 1.107.0 Returns null if the data availability can not be determined.
		 *
		 * @return {boolean|undefined|null} Returns TRUE if data is available, otherwise FALSE.
		 *                                  If the request is still being resolved, returns undefined.
		 *                                  If the data availability can not be determined, returns null.
		 */
		selectDataAvailability,

		/**
		 * Checks if data is available on load.
		 *
		 * @since 1.96.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {(string|null|undefined)} The existing tag `string` if present, `null` if not present, or `undefined` if not loaded yet.
		 */
		isDataAvailableOnLoad( state ) {
			return state.dataAvailableOnLoad;
		},

		/**
		 * Determines whether the module is still gathering data or not.
		 *
		 * @todo Review the name of this selector to a less confusing one.
		 * @since 1.96.0
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean|undefined} Returns TRUE if gathering data, otherwise FALSE. If the request is still being resolved, returns undefined.
		 */
		isGatheringData( state ) {
			return state.gatheringData;
		},
	};

	return Data.combineStores( fetchSaveDataAvailableStateStore, {
		actions,
		controls,
		initialState,
		reducer,
		resolvers,
		selectors,
	} );
};
