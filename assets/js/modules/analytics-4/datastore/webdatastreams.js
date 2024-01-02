/**
 * `modules/analytics-4` data store: webdatastreams.
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
import { pick, difference } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { MODULES_ANALYTICS } from '../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4, MAX_WEBDATASTREAMS_PER_BATCH } from './constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { isValidPropertyID } from '../utils/validation';
const { createRegistryControl, createRegistrySelector } = Data;

const fetchGetWebDataStreamsStore = createFetchStore( {
	baseName: 'getWebDataStreams',
	controlCallback( { propertyID } ) {
		return API.get(
			'modules',
			'analytics-4',
			'webdatastreams',
			{ propertyID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback( state, webDataStreams, { propertyID } ) {
		return {
			...state,
			webdatastreams: {
				...state.webdatastreams,
				[ propertyID ]: Array.isArray( webDataStreams )
					? webDataStreams
					: [],
			},
		};
	},
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
	},
} );

const fetchGetWebDataStreamsBatchStore = createFetchStore( {
	baseName: 'getWebDataStreamsBatch',
	controlCallback( { propertyIDs } ) {
		return API.get(
			'modules',
			'analytics-4',
			'webdatastreams-batch',
			{ propertyIDs },
			{
				useCache: false,
			}
		);
	},
	reducerCallback( state, webDataStreams ) {
		return {
			...state,
			webdatastreams: {
				...state.webdatastreams,
				...( webDataStreams || {} ),
			},
		};
	},
	argsToParams( propertyIDs ) {
		return { propertyIDs };
	},
	validateParams( { propertyIDs } = {} ) {
		invariant(
			Array.isArray( propertyIDs ),
			'GA4 propertyIDs must be an array.'
		);
		propertyIDs.forEach( ( propertyID ) => {
			invariant(
				isValidPropertyID( propertyID ),
				'A valid GA4 propertyID is required.'
			);
		} );
	},
} );

const fetchCreateWebDataStreamStore = createFetchStore( {
	baseName: 'createWebDataStream',
	controlCallback( { propertyID } ) {
		return API.set( 'modules', 'analytics-4', 'create-webdatastream', {
			propertyID,
		} );
	},
	reducerCallback( state, webDataStream, { propertyID } ) {
		return {
			...state,
			webdatastreams: {
				...state.webdatastreams,
				[ propertyID ]: [
					...( state.webdatastreams[ propertyID ] || [] ),
					webDataStream,
				],
			},
		};
	},
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant(
			isValidPropertyID( propertyID ),
			'A valid GA4 propertyID is required.'
		);
	},
} );

// Actions
const WAIT_FOR_WEBDATASTREAMS = 'WAIT_FOR_WEBDATASTREAMS';

const baseInitialState = {
	webdatastreams: {},
};

const baseActions = {
	/**
	 * Creates a new GA4 web data stream.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	createWebDataStream: createValidatedAction(
		( propertyID ) => {
			invariant( propertyID, 'GA4 propertyID is required.' );
		},
		function* ( propertyID ) {
			const { response, error } =
				yield fetchCreateWebDataStreamStore.actions.fetchCreateWebDataStream(
					propertyID
				);
			return { response, error };
		}
	),

	/**
	 * Matches web data stream for provided property.
	 *
	 * @since 1.38.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object|null} Matched web data stream object on success, otherwise NULL.
	 */
	*matchWebDataStream( propertyID ) {
		yield baseActions.waitForWebDataStreams( propertyID );

		const registry = yield Data.commonActions.getRegistry();
		return registry
			.select( MODULES_ANALYTICS_4 )
			.getMatchingWebDataStreamByPropertyID( propertyID );
	},

	/**
	 * Waits for web data streams to be loaded for a property.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 */
	*waitForWebDataStreams( propertyID ) {
		yield {
			payload: { propertyID },
			type: WAIT_FOR_WEBDATASTREAMS,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_WEBDATASTREAMS ]: createRegistryControl(
		( { __experimentalResolveSelect } ) => {
			return async ( { payload } ) => {
				const { propertyID } = payload;
				await __experimentalResolveSelect(
					MODULES_ANALYTICS_4
				).getWebDataStreams( propertyID );
			};
		}
	),
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getWebDataStreams( propertyID ) {
		const registry = yield Data.commonActions.getRegistry();
		// Only fetch web data streams if there are none in the store for the given property.
		const webdatastreams = registry
			.select( MODULES_ANALYTICS_4 )
			.getWebDataStreams( propertyID );
		if ( webdatastreams === undefined ) {
			yield fetchGetWebDataStreamsStore.actions.fetchGetWebDataStreams(
				propertyID
			);
		}
	},
	*getWebDataStreamsBatch( propertyIDs ) {
		const registry = yield Data.commonActions.getRegistry();
		const webdatastreams =
			registry
				.select( MODULES_ANALYTICS_4 )
				.getWebDataStreamsBatch( propertyIDs ) || {};

		const availablePropertyIDs = Object.keys( webdatastreams );
		const remainingPropertyIDs = difference(
			propertyIDs,
			availablePropertyIDs
		);
		if ( remainingPropertyIDs.length > 0 ) {
			for (
				let i = 0;
				i < remainingPropertyIDs.length;
				i += MAX_WEBDATASTREAMS_PER_BATCH
			) {
				const chunk = remainingPropertyIDs.slice(
					i,
					i + MAX_WEBDATASTREAMS_PER_BATCH
				);
				yield fetchGetWebDataStreamsBatchStore.actions.fetchGetWebDataStreamsBatch(
					chunk
				);
			}
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all GA4 web data streams this account can access.
	 *
	 * @since 1.31.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The GA4 property ID to fetch web data streams for.
	 * @return {(Array.<Object>|undefined)} An array of GA4 web data streams; `undefined` if not loaded.
	 */
	getWebDataStreams( state, propertyID ) {
		return state.webdatastreams[ propertyID ];
	},

	/**
	 * Gets matched web data stream from a list of web data streams.
	 *
	 * @since 1.31.0
	 * @since 1.90.0 Updated to match a data stream from a list of provided web data streams.
	 *
	 * @param {Object} state       Data store's state.
	 * @param {Array}  datastreams A list of web data streams.
	 * @return {(Object|null)} A web data stream object if found, otherwise null.
	 */
	getMatchingWebDataStream: createRegistrySelector(
		( select ) => ( state, datastreams ) => {
			const matchedWebDataStreams =
				select( MODULES_ANALYTICS_4 ).getMatchingWebDataStreams(
					datastreams
				);

			return matchedWebDataStreams[ 0 ] || null;
		}
	),

	/**
	 * Gets web data streams that match the current reference URL.
	 *
	 * @since 1.98.0
	 *
	 * @param {Object} state       Data store's state.
	 * @param {Array}  datastreams A list of web data streams.
	 * @return {Array.<Object>} An array of found matched web data streams.
	 */
	getMatchingWebDataStreams: createRegistrySelector(
		( select ) => ( state, datastreams ) => {
			invariant(
				Array.isArray( datastreams ),
				'datastreams must be an array.'
			);

			const matchedWebDataStreams = [];

			for ( const datastream of datastreams ) {
				if (
					select( CORE_SITE ).isSiteURLMatch(
						// eslint-disable-next-line sitekit/acronym-case
						datastream.webStreamData?.defaultUri
					)
				) {
					matchedWebDataStreams.push( datastream );
				}
			}

			return matchedWebDataStreams;
		}
	),

	/**
	 * Gets matched web data stream for selected property.
	 *
	 * @since 1.90.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The GA4 property ID to find matched web data stream.
	 * @return {(Object|null|undefined)} A web data stream object if found, otherwise null; `undefined` if web data streams are not loaded.
	 */
	getMatchingWebDataStreamByPropertyID: createRegistrySelector(
		( select ) => ( _state, propertyID ) => {
			const datastreams =
				select( MODULES_ANALYTICS_4 ).getWebDataStreams( propertyID );
			if ( datastreams === undefined ) {
				return undefined;
			}

			const matchingDataStream =
				select( MODULES_ANALYTICS_4 ).getMatchingWebDataStream(
					datastreams
				);

			return matchingDataStream || null;
		}
	),

	/**
	 * Gets web data streams in batch for selected properties.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object}         state       Data store's state.
	 * @param {Array.<string>} propertyIDs GA4 property IDs.
	 * @return {Object} Web data streams.
	 */
	getWebDataStreamsBatch( state, propertyIDs ) {
		return pick( state.webdatastreams, propertyIDs );
	},

	/**
	 * Gets the matched measurement IDs for the given property IDs.
	 *
	 * @since 1.88.0
	 * @since 1.90.0 Use propertyIDs instead of property objects for matching.
	 *
	 * @param {Object}         state       Data store's state.
	 * @param {Array.<string>} propertyIDs GA4 property IDs array of strings.
	 * @return {(Object|undefined)} Object with matched property ID as the key and measurement ID as the value, or an empty object if no matches are found; `undefined` if web data streams are not loaded.
	 */
	getMatchedMeasurementIDsByPropertyIDs: createRegistrySelector(
		( select ) => ( _state, propertyIDs ) => {
			invariant(
				Array.isArray( propertyIDs ) && propertyIDs?.length,
				'propertyIDs must be an array containing GA4 propertyIDs.'
			);

			propertyIDs.forEach( ( propertyID ) => {
				invariant(
					isValidPropertyID( propertyID ),
					'A valid GA4 propertyID is required.'
				);
			} );

			const datastreams =
				select( MODULES_ANALYTICS_4 ).getWebDataStreamsBatch(
					propertyIDs
				);

			if ( datastreams === undefined ) {
				return undefined;
			}

			return propertyIDs.reduce( ( acc, currentPropertyID ) => {
				if ( ! datastreams[ currentPropertyID ]?.length ) {
					return acc;
				}

				const matchingDataStream = select(
					MODULES_ANALYTICS_4
				).getMatchingWebDataStream( datastreams[ currentPropertyID ] );

				if ( ! matchingDataStream ) {
					return acc;
				}

				const measurementID =
					// eslint-disable-next-line sitekit/acronym-case
					matchingDataStream.webStreamData.measurementId;

				return {
					...acc,
					[ currentPropertyID ]: measurementID,
				};
			}, {} );
		}
	),

	/**
	 * Gets an Analytics config that matches one of provided measurement IDs.
	 *
	 * @since 1.94.0
	 *
	 * @param {Object}                state        Data store's state.
	 * @param {string|Array.<string>} measurements Single GA4 measurement ID, or array of GA4 measurement ID strings.
	 * @return {(Object|null|undefined)} An Analytics config that matches provided one of measurement IDs on success, NULL if no matching config is found, undefined if data hasn't been resolved yet.
	 */
	getAnalyticsConfigByMeasurementIDs: createRegistrySelector(
		( select ) => ( state, measurements ) => {
			const measurementIDs = Array.isArray( measurements )
				? measurements
				: [ measurements ];

			let summaries = select( MODULES_ANALYTICS_4 ).getAccountSummaries();
			if ( ! Array.isArray( summaries ) ) {
				return undefined;
			}

			// Sort summaries to have the current account at the very beginning,
			// so we can check it first because its more likely that the current
			// account will contain a measurement ID that we are looking for.
			const currentAccountID = select( MODULES_ANALYTICS ).getAccountID();
			// Clone summaries to avoid mutating the original array.
			summaries = [ ...summaries ].sort( ( { _id: accountID } ) =>
				accountID === currentAccountID ? -1 : 0
			);

			const info = {};
			const propertyIDs = [];

			summaries.forEach( ( { _id: accountID, propertySummaries } ) => {
				propertySummaries.forEach( ( { _id: propertyID } ) => {
					propertyIDs.push( propertyID );
					info[ propertyID ] = {
						accountID,
						propertyID,
					};
				} );
			} );

			if ( propertyIDs.length === 0 ) {
				return null;
			}

			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const datastreams =
				select( MODULES_ANALYTICS_4 ).getWebDataStreamsBatch(
					propertyIDs
				);

			const resolvedDataStreams = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getWebDataStreamsBatch', [
				propertyIDs,
			] );

			// Return undefined if web data streams haven't been resolved yet.
			if ( ! resolvedDataStreams ) {
				return undefined;
			}

			let firstlyFoundConfig;

			for ( const propertyID in datastreams ) {
				if ( ! datastreams[ propertyID ]?.length ) {
					continue;
				}

				for ( const datastream of datastreams[ propertyID ] ) {
					const { _id: webDataStreamID, webStreamData } = datastream;
					const {
						defaultUri: defaultURI,
						measurementId: measurementID, // eslint-disable-line sitekit/acronym-case
					} = webStreamData;

					if ( ! measurementIDs.includes( measurementID ) ) {
						continue;
					}

					const config = {
						...info[ propertyID ],
						webDataStreamID,
						measurementID,
					};

					// Remember the firstly found config to return it at the end
					// if we don't manage to find the most suitable config.
					if ( ! firstlyFoundConfig ) {
						firstlyFoundConfig = config;
					}

					// If only one measurement ID is provided, then we don't need
					// to check whether its default URI matches the current
					// reference URL. Otherwise, if we have many measurement IDs
					// then we need to find the one that matches the current
					// reference URL.
					if (
						measurementIDs.length === 1 ||
						select( CORE_SITE ).isSiteURLMatch( defaultURI )
					) {
						return config;
					}
				}
			}

			return firstlyFoundConfig || null;
		}
	),

	/**
	 * Checks if web data streams are currently being loaded.
	 *
	 * This selector was introduced as a convenience for reusing the same loading logic across multiple
	 * components, initially the `WebDataStreamSelect` and `SettingsEnhancedMeasurementSwitch` components.
	 *
	 * @since 1.111.0
	 *
	 * @param {Object}  state                Data store's state.
	 * @param {Object}  args                 Arguments object.
	 * @param {boolean} args.hasModuleAccess Whether the current user has access to the Analytics module(s).
	 */
	isLoadingWebDataStreams: createRegistrySelector(
		( select ) =>
			( state, { hasModuleAccess } ) => {
				if (
					! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getAccountSummaries'
					)
				) {
					return true;
				}

				const propertyID =
					select( MODULES_ANALYTICS_4 ).getPropertyID();
				const loadedWebDataStreams =
					isValidPropertyID( propertyID ) && hasModuleAccess !== false
						? select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
								'getWebDataStreams',
								[ propertyID ]
						  )
						: true;

				if ( ! loadedWebDataStreams ) {
					return true;
				}

				if (
					select(
						MODULES_ANALYTICS
					).hasFinishedSelectingAccount() === false
				) {
					return true;
				}

				if (
					select( MODULES_ANALYTICS_4 ).isMatchingAccountProperty()
				) {
					return true;
				}

				return select( MODULES_ANALYTICS_4 ).isResolving(
					'getProperty',
					[ propertyID ]
				);
			}
	),
};

const store = Data.combineStores(
	fetchGetWebDataStreamsStore,
	fetchGetWebDataStreamsBatchStore,
	fetchCreateWebDataStreamStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
