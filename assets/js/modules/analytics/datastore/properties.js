/**
 * `modules/analytics` data store: properties.
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

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import {
	isValidAccountID,
	isValidPropertyID,
	parsePropertyID,
	isValidPropertySelection,
	matchPropertyByURL,
} from '../util';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	MODULES_ANALYTICS,
	PROPERTY_CREATE,
	PROFILE_CREATE,
	PROPERTY_TYPE_UA,
	PROPERTY_TYPE_GA4,
} from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';

// Get access to error store action creators.
// If the parent store doesn't include the error store,
// yielded error actions will be a no-op.
const { clearError, receiveError } = errorStoreActions;
const { createRegistrySelector, createRegistryControl } = Data;

const fetchGetPropertiesProfilesStore = createFetchStore( {
	baseName: 'getPropertiesProfiles',
	controlCallback: ( { accountID } ) => {
		return API.get(
			'modules',
			'analytics',
			'properties-profiles',
			{ accountID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, response, { accountID } ) => {
		// Actual properties, profiles are set by resolver with custom logic,
		// hence here we just set a flag.
		return {
			...state,
			isAwaitingPropertiesProfilesCompletion: {
				...state.isAwaitingPropertiesProfilesCompletion,
				[ accountID ]: true,
			},
		};
	},
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

const fetchCreatePropertyStore = createFetchStore( {
	baseName: 'createProperty',
	controlCallback: ( { accountID } ) => {
		return API.set( 'modules', 'analytics', 'create-property', {
			accountID,
		} );
	},
	reducerCallback: ( state, property, { accountID } ) => {
		return {
			...state,
			properties: {
				...state.properties,
				[ accountID ]: [
					...( state.properties[ accountID ] || [] ),
					property,
				],
			},
		};
	},
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

// Actions
const RECEIVE_MATCHED_PROPERTY = 'RECEIVE_MATCHED_PROPERTY';
const RECEIVE_GET_PROPERTIES = 'RECEIVE_GET_PROPERTIES';
const RECEIVE_PROPERTIES_PROFILES_COMPLETION =
	'RECEIVE_PROPERTIES_PROFILES_COMPLETION';
const WAIT_FOR_PROPERTIES = 'WAIT_FOR_PROPERTIES';
const SET_PRIMARY_PROPERTY_TYPE = 'SET_PRIMARY_PROPERTY_TYPE';

const baseInitialState = {
	properties: {},
	isAwaitingPropertiesProfilesCompletion: {},
	matchedProperty: undefined,
	primaryPropertyType: PROPERTY_TYPE_UA,
};

const baseActions = {
	/**
	 * Creates a new Analytics property.
	 *
	 * Creates a new Analytics property for an existing Google Analytics account.
	 *
	 * @since 1.8.0
	 *
	 * @param {string} accountID Google Analytics account ID.
	 * @return {Object} Object with `response` and `error`.
	 */
	createProperty: createValidatedAction(
		( accountID ) => {
			invariant( accountID, 'accountID is required.' );
		},
		function* ( accountID ) {
			const { response, error } =
				yield fetchCreatePropertyStore.actions.fetchCreateProperty(
					accountID
				);
			return { response, error };
		}
	),

	/**
	 * Adds a matchedProperty to the store.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} matchedProperty Property object.
	 * @return {Object} Redux-style action.
	 */
	receiveMatchedProperty( matchedProperty ) {
		invariant( matchedProperty, 'matchedProperty is required.' );

		return {
			payload: { matchedProperty },
			type: RECEIVE_MATCHED_PROPERTY,
		};
	},

	/**
	 * Sets the given property and related fields in the store.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {string} propertyID           Property ID to select.
	 * @param {string} [internalPropertyID] Internal property ID (if available).
	 * @return {Object} A Generator function.
	 */
	selectProperty: createValidatedAction(
		( propertyID ) => {
			invariant(
				isValidPropertySelection( propertyID ),
				'A valid propertyID selection is required.'
			);
		},
		function* ( propertyID, internalPropertyID = '' ) {
			const registry = yield Data.commonActions.getRegistry();

			const accountID = registry
				.select( MODULES_ANALYTICS )
				.getAccountID();
			if ( ! isValidAccountID( accountID ) ) {
				return;
			}

			registry.dispatch( MODULES_ANALYTICS ).setPropertyID( propertyID );

			if ( PROPERTY_CREATE === propertyID ) {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setProfileID( PROFILE_CREATE );
				return;
			}

			yield baseActions.waitForProperties( accountID );
			const property =
				registry
					.select( MODULES_ANALYTICS )
					.getPropertyByID( propertyID ) || {};

			if ( ! internalPropertyID ) {
				internalPropertyID = property.internalWebPropertyId; // eslint-disable-line sitekit/acronym-case
			}

			registry
				.dispatch( MODULES_ANALYTICS )
				.setInternalWebPropertyID( internalPropertyID || '' );

			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const existingProfileID = registry
				.select( MODULES_ANALYTICS )
				.getProfileID();
			const profiles = yield Data.commonActions.await(
				registry
					.resolveSelect( MODULES_ANALYTICS )
					.getProfiles( accountID, propertyID )
			);

			if ( ! Array.isArray( profiles ) ) {
				return; // Something unexpected occurred and we want to avoid type errors.
			}

			// If there was an existing profile ID set and it belongs to the selected property, we're done.
			if (
				existingProfileID &&
				profiles.some( ( profile ) => profile.id === existingProfileID )
			) {
				return;
			}

			// If the property has a default profile that exists, use that.
			if (
				// eslint-disable-next-line sitekit/acronym-case
				property.defaultProfileId &&
				profiles.some(
					// eslint-disable-next-line sitekit/acronym-case
					( profile ) => profile.id === property.defaultProfileId
				)
			) {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setProfileID( property.defaultProfileId ); // eslint-disable-line sitekit/acronym-case
				return;
			}

			// Otherwise just select the first profile, or the option to create if none.
			registry
				.dispatch( MODULES_ANALYTICS )
				.setProfileID( profiles[ 0 ]?.id || PROFILE_CREATE );
		}
	),

	/**
	 * Finds matching property for provided account.
	 *
	 * @since 1.38.0
	 *
	 * @param {string} accountID Account ID.
	 * @return {Object|null} Matched property object on success, otherwise NULL.
	 */
	*findMatchedProperty( accountID ) {
		yield baseActions.waitForProperties( accountID );

		const registry = yield Data.commonActions.getRegistry();
		const urls = registry.select( CORE_SITE ).getSiteURLPermutations();
		const uaProperties = registry
			.select( MODULES_ANALYTICS )
			.getProperties( accountID );

		return matchPropertyByURL( uaProperties, urls );
	},

	receiveGetProperties( properties, { accountID } ) {
		invariant(
			Array.isArray( properties ),
			'properties must be an array.'
		);
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { properties, accountID },
			type: RECEIVE_GET_PROPERTIES,
		};
	},

	receivePropertiesProfilesCompletion( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID },
			type: RECEIVE_PROPERTIES_PROFILES_COMPLETION,
		};
	},

	waitForProperties( accountID ) {
		return {
			payload: { accountID },
			type: WAIT_FOR_PROPERTIES,
		};
	},

	/**
	 * Sets the primary property type.
	 *
	 * @since 1.32.0
	 *
	 * @param {string} primaryPropertyType Must be "ua" or "ga4".
	 * @return {Object} Redux-style action.
	 */
	setPrimaryPropertyType( primaryPropertyType ) {
		invariant(
			[ PROPERTY_TYPE_UA, PROPERTY_TYPE_GA4 ].includes(
				primaryPropertyType
			),
			`type must be "${ PROPERTY_TYPE_UA }" or "${ PROPERTY_TYPE_GA4 }"`
		);

		return {
			payload: { primaryPropertyType },
			type: SET_PRIMARY_PROPERTY_TYPE,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_PROPERTIES ]: createRegistryControl(
		( registry ) =>
			( { payload: { accountID } } ) => {
				const arePropertiesLoaded = () =>
					registry
						.select( MODULES_ANALYTICS )
						.getProperties( accountID ) !== undefined;

				if ( arePropertiesLoaded() ) {
					return true;
				}

				return new Promise( ( resolve ) => {
					const unsubscribe = registry.subscribe( () => {
						if ( arePropertiesLoaded() ) {
							unsubscribe();
							resolve();
						}
					} );
				} );
			}
	),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_MATCHED_PROPERTY: {
			const { matchedProperty } = payload;

			return {
				...state,
				matchedProperty,
			};
		}

		case RECEIVE_GET_PROPERTIES: {
			const { properties, accountID } = payload;

			return {
				...state,
				properties: {
					...state.properties,
					[ accountID ]: [ ...properties ],
				},
			};
		}

		case RECEIVE_PROPERTIES_PROFILES_COMPLETION: {
			const { accountID } = payload;

			return {
				...state,
				isAwaitingPropertiesProfilesCompletion: {
					...state.isAwaitingPropertiesProfilesCompletion,
					[ accountID ]: false,
				},
			};
		}

		case SET_PRIMARY_PROPERTY_TYPE: {
			const { primaryPropertyType } = payload;

			return {
				...state,
				primaryPropertyType,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getProperties( accountID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		yield clearError( 'getProperties', [ accountID ] );

		// Only fetch properties if there are none in the store for the given account.
		let properties = registry
			.select( MODULES_ANALYTICS )
			.getProperties( accountID );
		if ( properties === undefined ) {
			const { response, error } =
				yield fetchGetPropertiesProfilesStore.actions.fetchGetPropertiesProfiles(
					accountID
				);
			const { dispatch } = registry;
			if ( response ) {
				dispatch( MODULES_ANALYTICS ).receiveGetProperties(
					response.properties,
					{ accountID }
				);

				// eslint-disable-next-line sitekit/acronym-case
				if ( response.profiles?.[ 0 ]?.webPropertyId ) {
					// eslint-disable-next-line sitekit/acronym-case
					const propertyID = response.profiles[ 0 ].webPropertyId;
					dispatch( MODULES_ANALYTICS ).receiveGetProfiles(
						response.profiles,
						{
							accountID,
							propertyID,
						}
					);
				}

				if ( response.matchedProperty ) {
					dispatch( MODULES_ANALYTICS ).receiveMatchedProperty(
						response.matchedProperty
					);
				}

				( { properties } = response );
			}

			dispatch( MODULES_ANALYTICS ).receivePropertiesProfilesCompletion(
				accountID
			);
			if ( error ) {
				// Store error manually since getProperties signature differs from fetchGetPropertiesProfiles.
				yield receiveError( error, 'getProperties', [ accountID ] );
			}
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the property object by the property ID.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID Property ID.
	 * @return {(Object|undefined)} Property object, or undefined if not present in store.
	 */
	getPropertyByID( state, propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return undefined;
		}
		const { accountID } = parsePropertyID( propertyID );

		return ( state.properties[ accountID ] || [] ).find(
			( { id } ) => id === propertyID
		);
	},

	/**
	 * Gets the primary property type.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} "ua" or "ga4".
	 */
	getPrimaryPropertyType( state ) {
		return state.primaryPropertyType;
	},

	/**
	 * Gets the matched property, if any.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Matched property if set, otherwise `undefined`.
	 */
	getMatchedProperty( state ) {
		return state.matchedProperty;
	},

	/**
	 * Gets all Google Analytics properties this account can access.
	 *
	 * Returns an array of all analytics properties.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of Analytics properties; `undefined` if not loaded.
	 */
	getProperties( state, accountID ) {
		const { properties } = state;

		return properties[ accountID ];
	},

	/**
	 * Checks if a property is being created for an account.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to check for property creation.
	 * @return {boolean} `true` if creating a property, `false` if not.
	 */
	isDoingCreateProperty: createRegistrySelector(
		( select ) => ( state, accountID ) => {
			return select( MODULES_ANALYTICS ).isFetchingCreateProperty(
				accountID
			);
		}
	),

	/**
	 * Checks if properties are being fetched for the given account.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to check for property creation.
	 * @return {boolean} `true` if fetching a properties, `false` if not.
	 */
	isDoingGetProperties: createRegistrySelector(
		( select ) => ( state, accountID ) => {
			// Check if dispatch calls right after fetching are still awaiting.
			if (
				accountID &&
				state.isAwaitingPropertiesProfilesCompletion[ accountID ]
			) {
				return true;
			}

			return select( MODULES_ANALYTICS ).isFetchingGetPropertiesProfiles(
				accountID
			);
		}
	),

	/**
	 * Gets all Analytic and GA4 properties this account can access.
	 *
	 * Returns an array of all UA + GA4 analytics properties.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of Analytics properties; `undefined` if not loaded.
	 */
	getPropertiesIncludingGA4: createRegistrySelector(
		( select ) => ( state, accountID ) => {
			let properties =
				select( MODULES_ANALYTICS ).getProperties( accountID );
			if ( properties === undefined ) {
				return undefined;
			}

			const propertiesGA4 =
				select( MODULES_ANALYTICS_4 ).getProperties( accountID );
			if ( propertiesGA4 === undefined ) {
				return undefined;
			}
			properties = properties.concat( propertiesGA4 );

			const isGA4 = ( property ) => !! property._id;
			const compare = ( a, b ) => {
				if ( a < b ) {
					return -1;
				}
				if ( a > b ) {
					return 1;
				}
				return 0;
			};

			return properties.sort( ( a, b ) => {
				const aName = isGA4( a ) ? a.displayName : a.name;
				const bName = isGA4( b ) ? b.displayName : b.name;

				if ( aName !== bName ) {
					return compare( aName, bName );
				}

				const aID = isGA4( a ) ? a._id : a.id;
				const bID = isGA4( b ) ? b._id : b.id;

				return compare( aID, bID );
			} );
		}
	),
};

const store = Data.combineStores(
	fetchGetPropertiesProfilesStore,
	fetchCreatePropertyStore,
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
