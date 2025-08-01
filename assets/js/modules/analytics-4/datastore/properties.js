/**
 * `modules/analytics-4` data store: properties.
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

/* eslint-disable sitekit/jsdoc-no-unnamed-boolean-params */

/**
 * External dependencies
 */
import invariant from 'invariant';
import { isBoolean } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../tagmanager/datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	MAX_WEBDATASTREAMS_PER_BATCH,
	WEBDATASTREAM_CREATE,
} from './constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../constants';
import { HOUR_IN_SECONDS, normalizeURL } from '../../../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import {
	isValidAccountID,
	isValidPropertyID,
	isValidPropertySelection,
} from '../utils/validation';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';

const fetchGetPropertyStore = createFetchStore( {
	baseName: 'getProperty',
	controlCallback( { propertyID } ) {
		return get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'property',
			{ propertyID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: createReducer( ( state, property, { propertyID } ) => {
		state.propertiesByID = state.propertiesByID || {};
		state.propertiesByID[ propertyID ] = property;
	} ),
	argsToParams( propertyID ) {
		return { propertyID };
	},
	validateParams( { propertyID } = {} ) {
		invariant( propertyID, 'propertyID is required.' );
	},
} );

const fetchGetPropertiesStore = createFetchStore( {
	baseName: 'getProperties',
	controlCallback( { accountID } ) {
		return get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'properties',
			{ accountID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: createReducer( ( state, properties, { accountID } ) => {
		state.properties = state.properties || {};
		state.propertiesByID = state.propertiesByID || {};

		state.properties[ accountID ] = properties;

		for ( const property of properties ) {
			state.propertiesByID[ property._id ] = property;
		}
	} ),
	argsToParams( accountID ) {
		return { accountID };
	},
	validateParams( { accountID } = {} ) {
		invariant( accountID, 'accountID is required.' );
	},
} );

const fetchCreatePropertyStore = createFetchStore( {
	baseName: 'createProperty',
	controlCallback( { accountID } ) {
		return set( 'modules', MODULE_SLUG_ANALYTICS_4, 'create-property', {
			accountID,
		} );
	},
	reducerCallback: createReducer( ( state, property, { accountID } ) => {
		state.properties = state.properties || {};

		if ( ! state.properties[ accountID ] ) {
			state.properties[ accountID ] = [];
		}

		state.properties[ accountID ].push( property );
	} ),
	argsToParams( accountID ) {
		return { accountID };
	},
	validateParams( { accountID } = {} ) {
		invariant( accountID, 'accountID is required.' );
	},
} );

const fetchGetGoogleTagSettingsStore = createFetchStore( {
	baseName: 'getGoogleTagSettings',
	controlCallback( { measurementID } ) {
		return get( 'modules', MODULE_SLUG_ANALYTICS_4, 'google-tag-settings', {
			measurementID,
		} );
	},
	reducerCallback: createReducer(
		( state, googleTagSettings, { measurementID } ) => {
			if ( ! state.googleTagSettings ) {
				state.googleTagSettings = {};
			}

			state.googleTagSettings[ measurementID ] = googleTagSettings;
		}
	),
	argsToParams( measurementID ) {
		return { measurementID };
	},
	validateParams( { measurementID } = {} ) {
		invariant( measurementID, 'measurementID is required.' );
	},
} );

const fetchSetGoogleTagIDMismatch = createFetchStore( {
	baseName: 'setGoogleTagIDMismatch',
	controlCallback( { hasMismatchedTag } ) {
		return set(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'set-google-tag-id-mismatch',
			{
				hasMismatchedTag,
			}
		);
	},
	reducerCallback: createReducer( ( state, hasMismatchedTag ) => {
		if ( ! state.moduleData ) {
			state.moduleData = {};
		}

		state.moduleData.hasMismatchedTag = !! hasMismatchedTag;
	} ),
	argsToParams( hasMismatchedTag ) {
		return { hasMismatchedTag };
	},
	validateParams( { hasMismatchedTag } = {} ) {
		invariant(
			isBoolean( hasMismatchedTag ),
			'hasMismatchedTag must be boolean.'
		);
	},
} );

const fetchSetIsWebDataStreamAvailable = createFetchStore( {
	baseName: 'setIsWebDataStreamAvailable',
	controlCallback( { isWebDataStreamAvailable } ) {
		return set(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'set-is-web-data-stream-available',
			{
				isWebDataStreamAvailable,
			}
		);
	},
	reducerCallback( state, isWebDataStreamAvailable ) {
		return {
			...state,
			moduleData: {
				...state.moduleData,
				isWebDataStreamAvailable: !! isWebDataStreamAvailable,
			},
		};
	},
	argsToParams( isWebDataStreamAvailable ) {
		return { isWebDataStreamAvailable };
	},
	validateParams( { isWebDataStreamAvailable } = {} ) {
		invariant(
			isBoolean( isWebDataStreamAvailable ),
			'isWebDataStreamAvailable must be boolean.'
		);
	},
} );

// Actions
const MATCHING_ACCOUNT_PROPERTY = 'MATCHING_ACCOUNT_PROPERTY';
const SET_HAS_MISMATCHED_TAG = 'SET_HAS_MISMATCHED_GOOGLE_TAG_ID';

const baseInitialState = {
	properties: {},
	propertiesByID: {},
	isMatchingAccountProperty: false,
};

const baseActions = {
	/**
	 * Creates a new GA4 property.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} accountID Analytics account ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	createProperty( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return ( function* () {
			const { dispatch } = yield commonActions.getRegistry();

			const { response, error } =
				yield fetchCreatePropertyStore.actions.fetchCreateProperty(
					accountID
				);

			if ( response ) {
				// Refresh account summaries to load the new property.
				yield dispatch( MODULES_ANALYTICS_4 ).resetAccountSummaries();
			}

			return { response, error };
		} )();
	},

	/**
	 * Sets the given property and related fields in the store.
	 *
	 * @since 1.31.0
	 *
	 * @param {string} propertyID GA4 property ID.
	 * @return {Object} A Generator function.
	 */
	selectProperty: createValidatedAction(
		( propertyID ) => {
			invariant(
				isValidPropertySelection( propertyID ),
				'A valid propertyID selection is required.'
			);
		},
		function* ( propertyID ) {
			const registry = yield commonActions.getRegistry();
			const {
				setPropertyCreateTime,
				setSettings,
				setWebDataStreamID,
				updateSettingsForMeasurementID,
			} = registry.dispatch( MODULES_ANALYTICS_4 );

			setSettings( {
				propertyID,
				propertyCreateTime: 0,
			} );

			updateSettingsForMeasurementID( '' );

			if ( PROPERTY_CREATE === propertyID ) {
				setWebDataStreamID( WEBDATASTREAM_CREATE );
				return;
			}

			setWebDataStreamID( '' );

			if ( propertyID ) {
				const property = yield commonActions.await(
					registry
						.resolveSelect( MODULES_ANALYTICS_4 )
						.getProperty( propertyID )
				);

				if ( property?.createTime ) {
					setPropertyCreateTime( property.createTime );
				}
			}

			let webdatastream = yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStreamByPropertyID( propertyID )
			);

			if ( ! webdatastream ) {
				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );

				if ( webdatastreams?.length ) {
					webdatastream = webdatastreams[ 0 ];
				}
			}

			if ( webdatastream ) {
				setWebDataStreamID( webdatastream._id );
				updateSettingsForMeasurementID(
					// eslint-disable-next-line sitekit/acronym-case
					webdatastream.webStreamData.measurementId
				);
				return;
			}
			// At this point there is no web data stream to set.
			setWebDataStreamID( WEBDATASTREAM_CREATE );
		}
	),

	/**
	 * Finds a matching property and returns it.
	 *
	 * @since 1.36.0
	 *
	 * @return {Object|null} Matching property on success, otherwise NULL.
	 */
	*findMatchedProperty() {
		const registry = yield commonActions.getRegistry();
		const accounts = yield commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getAccountSummaries()
		);

		if ( ! Array.isArray( accounts ) || accounts.length === 0 ) {
			return null;
		}

		const url = registry.select( CORE_SITE ).getReferenceSiteURL();
		const propertyIDs = accounts.reduce(
			( acc, { propertySummaries: properties } ) => [
				...acc,
				...( properties || [] ).map( ( { _id } ) => _id ),
			],
			[]
		);

		return yield commonActions.await(
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.matchPropertyByURL( propertyIDs, url )
		);
	},

	/**
	 * Matches a property for provided accountID.
	 *
	 * @since 1.38.0
	 *
	 * @param {string} accountID GA4 account ID.
	 * @return {Object|null} Matched property object on success, otherwise NULL.
	 */
	*matchAccountProperty( accountID ) {
		const registry = yield commonActions.getRegistry();

		const referenceURL = registry.select( CORE_SITE ).getReferenceSiteURL();
		const propertySummaries = yield commonActions.await(
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getPropertySummaries( accountID )
		);

		const property = yield baseActions.matchPropertyByURL(
			( propertySummaries || [] ).map( ( { _id } ) => _id ),
			referenceURL
		);

		return property;
	},

	/**
	 * Matches and selects a property for provided accountID.
	 *
	 * @since 1.34.0
	 *
	 * @param {string} accountID          GA4 account ID.
	 * @param {string} fallbackPropertyID A fallback propertyID to use if a matched property is not found.
	 * @return {Object|null} Matched property object on success, otherwise NULL.
	 */
	*matchAndSelectProperty( accountID, fallbackPropertyID = '' ) {
		yield {
			payload: { isMatchingAccountProperty: true },
			type: MATCHING_ACCOUNT_PROPERTY,
		};

		const property = yield baseActions.matchAccountProperty( accountID );
		const propertyID = property?._id || fallbackPropertyID;
		if ( propertyID ) {
			yield baseActions.selectProperty( propertyID );
		}

		yield {
			payload: { isMatchingAccountProperty: false },
			type: MATCHING_ACCOUNT_PROPERTY,
		};

		return property;
	},

	/**
	 * Matches a property by URL.
	 *
	 * @since 1.33.0
	 *
	 * @param {Array.<number>}        properties Array of property IDs.
	 * @param {Array.<string>|string} url        A list of URLs or a signle URL to match properties.
	 * @return {Object} A property object if found.
	 */
	*matchPropertyByURL( properties, url ) {
		const registry = yield commonActions.getRegistry();
		const urls = ( Array.isArray( url ) ? url : [ url ] )
			.filter( ( item ) => typeof item === 'string' )
			.map( normalizeURL );

		for (
			let i = 0;
			i < properties.length;
			i += MAX_WEBDATASTREAMS_PER_BATCH
		) {
			const chunk = properties.slice(
				i,
				i + MAX_WEBDATASTREAMS_PER_BATCH
			);
			const webdatastreams = yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( chunk )
			);

			for ( const propertyID in webdatastreams ) {
				for ( const webdatastream of webdatastreams[ propertyID ] ) {
					for ( const singleURL of urls ) {
						if (
							singleURL ===
							normalizeURL(
								// eslint-disable-next-line sitekit/acronym-case
								webdatastream.webStreamData?.defaultUri
							)
						) {
							return yield commonActions.await(
								registry
									.resolveSelect( MODULES_ANALYTICS_4 )
									.getProperty( propertyID )
							);
						}
					}
				}
			}
		}

		return null;
	},

	/**
	 * Matches a property by measurement ID.
	 *
	 * @since 1.33.0
	 *
	 * @param {Array.<number>}        properties    Array of property IDs.
	 * @param {Array.<string>|string} measurementID A list of measurement IDs or a signle measurement ID to match properties.
	 * @return {Object} A property object if found.
	 */
	*matchPropertyByMeasurementID( properties, measurementID ) {
		const registry = yield commonActions.getRegistry();
		const measurementIDs = Array.isArray( measurementID )
			? measurementID
			: [ measurementID ];

		for (
			let i = 0;
			i < properties.length;
			i += MAX_WEBDATASTREAMS_PER_BATCH
		) {
			const chunk = properties.slice(
				i,
				i + MAX_WEBDATASTREAMS_PER_BATCH
			);
			const webdatastreams = yield commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( chunk )
			);

			for ( const propertyID in webdatastreams ) {
				for ( const webdatastream of webdatastreams[ propertyID ] ) {
					for ( const singleMeasurementID of measurementIDs ) {
						if (
							singleMeasurementID ===
							webdatastream.webStreamData?.measurementId // eslint-disable-line sitekit/acronym-case
						) {
							return yield commonActions.await(
								registry
									.resolveSelect( MODULES_ANALYTICS_4 )
									.getProperty( propertyID )
							);
						}
					}
				}
			}
		}

		return null;
	},

	/**
	 * Updates settings for a given measurement ID.
	 *
	 * @since 1.94.0
	 *
	 * @param {string} measurementID Measurement ID.
	 */
	*updateSettingsForMeasurementID( measurementID ) {
		const { select, dispatch, resolveSelect } =
			yield commonActions.getRegistry();

		if ( ! measurementID ) {
			dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				measurementID,
				googleTagAccountID: '',
				googleTagContainerID: '',
				googleTagID: '',
			} );
			return;
		}

		dispatch( MODULES_ANALYTICS_4 ).setMeasurementID( measurementID );

		// Wait for authentication to be resolved to check scopes.
		yield commonActions.await(
			resolveSelect( CORE_USER ).getAuthentication()
		);
		if ( ! select( CORE_USER ).hasScope( TAGMANAGER_READ_SCOPE ) ) {
			return;
		}

		const googleTagSettings = yield commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getGoogleTagSettings(
				measurementID
			)
		);

		if ( ! googleTagSettings ) {
			return;
		}

		const { googleTagAccountID, googleTagContainerID, googleTagID } =
			googleTagSettings;

		// Note that when plain actions are dispatched in a function where an await has occurred (this can be a regular async function that has awaited, or a generator function
		// action that yields to an async action), they are handled asynchronously when they would normally be synchronous. This means that following the usual pattern of dispatching
		// individual setter actions for the `googleTagAccountID`, `googleTagContainerID` and `googleTagID` settings each resulted in a rerender of the
		// GoogleTagIDMismatchNotification component, thus resulting in an erroneous call to the GET:container-destinations endpoint with mismatched settings. To mitigate this, we
		// dispatch a single action here to set all these settings at once. The same applies to the `setSettings()` call above.
		// See issue https://github.com/google/site-kit-wp/issues/6784 and the PR https://github.com/google/site-kit-wp/pull/6814.
		dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			googleTagAccountID,
			googleTagContainerID,
			googleTagID,
		} );
	},

	/**
	 * Sets if GA4 has mismatched Google Tag ID.
	 *
	 * @since 1.96.0
	 * @since 1.130.0 Updated to send value to the endpoint.
	 *
	 * @param {boolean} hasMismatchedTag If GA4 has mismatched Google Tag.
	 */
	*setHasMismatchedGoogleTagID( hasMismatchedTag ) {
		yield fetchSetGoogleTagIDMismatch.actions.fetchSetGoogleTagIDMismatch(
			hasMismatchedTag
		);
	},

	/**
	 * Sets if GA4 has mismatched Google Tag ID.
	 *
	 * @since 1.130.0
	 *
	 * @param {boolean} hasMismatchedTag If GA4 has mismatched Google Tag.
	 * @return {Object} Redux-style action.
	 */
	*receiveHasMismatchGoogleTagID( hasMismatchedTag ) {
		return {
			type: SET_HAS_MISMATCHED_TAG,
			payload: { hasMismatchedTag: !! hasMismatchedTag },
		};
	},

	/**
	 * Sets whether the Web Data Stream is available.
	 *
	 * @since 1.99.0
	 * @since n.e.x.t Updated to use the fetch store.
	 *
	 * @param {boolean} isWebDataStreamAvailable Whether the Web Data Stream is available.
	 * @return {Object} Generator function.
	 */
	*setIsWebDataStreamAvailable( isWebDataStreamAvailable ) {
		return yield fetchSetIsWebDataStreamAvailable.actions.fetchSetIsWebDataStreamAvailable(
			isWebDataStreamAvailable
		);
	},

	/**
	 * Syncs Google Tag settings.
	 *
	 * @since 1.95.0
	 */
	*syncGoogleTagSettings() {
		const { select, dispatch, resolveSelect } =
			yield commonActions.getRegistry();

		const hasTagManagerReadScope = select( CORE_USER ).hasScope(
			TAGMANAGER_READ_SCOPE
		);

		if ( ! hasTagManagerReadScope ) {
			return;
		}

		// Wait for modules to be available before selecting.
		yield commonActions.await( resolveSelect( CORE_MODULES ).getModules() );

		const { isModuleConnected } = select( CORE_MODULES );

		if ( ! isModuleConnected( MODULE_SLUG_ANALYTICS_4 ) ) {
			return;
		}

		// Wait for module settings to be available before selecting.
		yield commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const {
			getGoogleTagID,
			getMeasurementID,
			getGoogleTagLastSyncedAtMs,
			getGoogleTagAccountID,
			getGoogleTagContainerID,
		} = select( MODULES_ANALYTICS_4 );

		const measurementID = getMeasurementID();

		if ( ! measurementID ) {
			return;
		}

		const googleTagLastSyncedAtMs = getGoogleTagLastSyncedAtMs();

		// The "last synced" value should reflect the real time this action
		// was performed, so we don't use the reference date here.
		const timestamp = Date.now(); // eslint-disable-line sitekit/no-direct-date

		if (
			!! googleTagLastSyncedAtMs &&
			timestamp - googleTagLastSyncedAtMs < HOUR_IN_SECONDS * 1000
		) {
			return;
		}

		dispatch( MODULES_ANALYTICS_4 ).setGoogleTagLastSyncedAtMs( timestamp );

		const googleTagID = getGoogleTagID();

		if ( !! googleTagID ) {
			const googleTagContainer = yield commonActions.await(
				resolveSelect( MODULES_ANALYTICS_4 ).getGoogleTagContainer(
					measurementID
				)
			);

			if ( ! googleTagContainer ) {
				yield baseActions.setIsWebDataStreamAvailable( false );
			} else if ( ! googleTagContainer.tagIds.includes( googleTagID ) ) {
				yield baseActions.setHasMismatchedGoogleTagID( true );
			}
		} else {
			yield baseActions.updateSettingsForMeasurementID( measurementID );
		}

		const googleTagAccountID = getGoogleTagAccountID();
		const googleTagContainerID = getGoogleTagContainerID();

		const googleTagContainerDestinations = yield commonActions.await(
			resolveSelect(
				MODULES_ANALYTICS_4
			).getGoogleTagContainerDestinations(
				googleTagAccountID,
				googleTagContainerID
			)
		) || []; // Fallback used in the event of an error.

		const googleTagContainerDestinationIDs =
			googleTagContainerDestinations?.map(
				// eslint-disable-next-line sitekit/acronym-case
				( { destinationId } ) => destinationId
			);

		dispatch( MODULES_ANALYTICS_4 ).setGoogleTagContainerDestinationIDs(
			googleTagContainerDestinationIDs
		);

		dispatch( MODULES_ANALYTICS_4 ).saveSettings();
	},
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case MATCHING_ACCOUNT_PROPERTY: {
			state.isMatchingAccountProperty = payload.isMatchingAccountProperty;
			break;
		}

		case SET_HAS_MISMATCHED_TAG: {
			state.moduleData = state.moduleData || {};
			state.moduleData.hasMismatchedTag = payload.hasMismatchedTag;
			break;
		}

		default:
			break;
	}
} );

const baseResolvers = {
	*getProperties( accountID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		// Only fetch properties if there are none in the store for the given account.
		const properties = registry
			.select( MODULES_ANALYTICS_4 )
			.getProperties( accountID );
		if ( properties === undefined ) {
			yield fetchGetPropertiesStore.actions.fetchGetProperties(
				accountID
			);
		}
	},
	*getProperty( propertyID ) {
		const registry = yield commonActions.getRegistry();
		const property = registry
			.select( MODULES_ANALYTICS_4 )
			.getProperty( propertyID );
		if ( property === undefined ) {
			yield fetchGetPropertyStore.actions.fetchGetProperty( propertyID );
		}
	},
	*getPropertySummaries( accountID ) {
		const { resolveSelect } = yield commonActions.getRegistry();

		yield commonActions.await(
			resolveSelect( MODULES_ANALYTICS_4 ).getAccountSummaries(
				accountID
			)
		);
	},
	*getPropertyCreateTime() {
		const registry = yield commonActions.getRegistry();
		// Ensure settings are available to select.
		yield commonActions.await(
			registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings()
		);

		const propertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();

		const propertyCreateTime = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyCreateTime();

		if ( propertyCreateTime || ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const cachedPropertyCreateTime = yield commonActions.await(
			getItem(
				`analytics4-properties-getPropertyCreateTime-${ propertyID }`
			)
		);

		if ( cachedPropertyCreateTime.cacheHit ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setPropertyCreateTime( cachedPropertyCreateTime.value );

			return;
		}

		const property = yield commonActions.await(
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getProperty( propertyID )
		);

		if ( ! property?.createTime ) {
			return;
		}

		// Cache this value for 1 hour (the default cache time).
		yield commonActions.await(
			setItem(
				`analytics4-properties-getPropertyCreateTime-${ propertyID }`,
				property.createTime
			)
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( property.createTime );
	},
	*getGoogleTagSettings( measurementID ) {
		if ( ! measurementID ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const googleTagSettings = registry
			.select( MODULES_ANALYTICS_4 )
			.getGoogleTagSettings( measurementID );

		if ( googleTagSettings !== undefined ) {
			return googleTagSettings;
		}

		yield fetchGetGoogleTagSettingsStore.actions.fetchGetGoogleTagSettings(
			measurementID
		);
	},
};

const baseSelectors = {
	/**
	 * Gets all GA4 properties this account can access.
	 *
	 * @since 1.31.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The GA4 Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of GA4 properties; `undefined` if not loaded.
	 */
	getProperties( state, accountID ) {
		return state.properties[ accountID ];
	},

	/**
	 * Gets a property with specific ID.
	 *
	 * @since 1.31.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The GA4 property ID to fetch property object for.
	 * @return {(Object|undefined)} A property object; `undefined` if not loaded.
	 */
	getProperty( state, propertyID ) {
		return state.propertiesByID[ propertyID ];
	},

	/**
	 * Gets all GA4 properties from the account summaries this account can access.
	 *
	 * @since 1.118.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The GA4 Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of GA4 properties; `undefined` if not loaded.
	 */
	getPropertySummaries: createRegistrySelector(
		( select ) => ( state, accountID ) => {
			const accountSummaries =
				select( MODULES_ANALYTICS_4 ).getAccountSummaries();

			if ( accountSummaries === undefined ) {
				return undefined;
			}

			const account = accountSummaries.find(
				( summary ) => summary._id === accountID
			);

			return account ? account.propertySummaries : [];
		}
	),

	/**
	 * Gets Google tag settings.
	 *
	 * @since 1.150.0
	 *
	 * @param {Object} state         Data store's state.
	 * @param {string} measurementID Measurement ID.
	 * @return {(Object|undefined)} A Google tag settings object; `undefined` if not loaded.
	 */
	getGoogleTagSettings( state, measurementID ) {
		return state.googleTagSettings?.[ measurementID ];
	},

	/**
	 * Determines whether we are matching account property or not.
	 *
	 * @since 1.98.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if we matching account property right now, otherwise FALSE.
	 */
	isMatchingAccountProperty( state ) {
		return state.isMatchingAccountProperty;
	},

	/**
	 * Checks if properties summaries are currently being loaded.
	 *
	 * This selector was introduced as a convenience for reusing the same loading logic across multiple
	 * components, initially the `PropertySelect` and `SettingsEnhancedMeasurementSwitch` components.
	 *
	 * @since 1.118.0
	 *
	 * @return {boolean} TRUE if the properties summaries are currently being loaded, otherwise FALSE.
	 */
	isLoadingPropertySummaries: createRegistrySelector( ( select ) => () => {
		return (
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getAccountSummaries'
			) ||
			select( MODULES_ANALYTICS_4 ).isMatchingAccountProperty() ||
			select( MODULES_ANALYTICS_4 ).hasFinishedSelectingAccount() ===
				false
		);
	} ),
};

const store = combineStores(
	fetchCreatePropertyStore,
	fetchGetPropertiesStore,
	fetchGetPropertyStore,
	fetchGetGoogleTagSettingsStore,
	fetchSetGoogleTagIDMismatch,
	fetchSetIsWebDataStreamAvailable,
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
