/**
 * `modules/reader-revenue-manager` data store: publications.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies.
 */
import { get, set } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	getPaymentOption,
	getProductIDs,
} from '@/js/modules/reader-revenue-manager/utils/settings';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from './constants';

const fetchGetPublicationsStore = createFetchStore( {
	baseName: 'getPublications',
	controlCallback: () =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'publications',
			{},
			{ useCache: false }
		),
	reducerCallback: createReducer( ( state, publications ) => {
		state.publications = publications;

		if ( state.settings?.publicationID ) {
			const publication = publications?.find(
				// eslint-disable-next-line sitekit/acronym-case
				( { publicationId: id } ) => id === state.settings.publicationID
			);

			if ( publication ) {
				const newSettings = {
					publicationOnboardingState: publication.onboardingState,
					productIDs: getProductIDs( publication.products ),
					paymentOption: getPaymentOption(
						publication.paymentOptions
					),
				};

				if ( publication.contentPolicyStatus ) {
					newSettings.contentPolicyState =
						publication.contentPolicyStatus.contentPolicyState;
					newSettings.policyInfoLink =
						publication.contentPolicyStatus.policyInfoLink || '';
				}

				Object.assign( state.settings, newSettings );

				if ( state.savedSettings ) {
					Object.assign( state.savedSettings, newSettings );
				}
			}
		}
	} ),
} );

const fetchCreatePublicationStore = createFetchStore( {
	baseName: 'createPublication',
	controlCallback: ( { displayName, languageCode, regionCode } ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'create-publication',
			{
				displayName,
				languageCode,
				regionCode,
			}
		),
	argsToParams: ( { displayName, languageCode, regionCode } = {} ) => ( {
		displayName,
		languageCode,
		regionCode,
	} ),
	validateParams: ( { displayName, languageCode, regionCode } = {} ) => {
		invariant(
			typeof displayName === 'string' && displayName.length > 0,
			'displayName is required and must be a string.'
		);
		invariant(
			typeof languageCode === 'string' && languageCode.length > 0,
			'languageCode is required and must be a string.'
		);
		invariant(
			typeof regionCode === 'string' && regionCode.length > 0,
			'regionCode is required and must be a string.'
		);
	},
	isAction: true,
} );

const fetchGetPublicationStore = createFetchStore( {
	baseName: 'getPublication',
	controlCallback: ( { organizationID, publicationID } ) =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'publication',
			{
				organizationID,
				publicationID,
			},
			{ useCache: false }
		),
	reducerCallback: createReducer(
		( state, publication, { organizationID, publicationID } ) => {
			state.publicationsByOrganization =
				state.publicationsByOrganization || {};
			state.publicationsByOrganization[ organizationID ] =
				state.publicationsByOrganization[ organizationID ] || {};
			state.publicationsByOrganization[ organizationID ][
				publicationID
			] = publication;
		}
	),
	argsToParams: ( { organizationID, publicationID } = {} ) => ( {
		organizationID,
		publicationID,
	} ),
	validateParams: ( { organizationID, publicationID } = {} ) => {
		invariant(
			typeof organizationID === 'string' && organizationID.length > 0,
			'organizationID is required and must be a string.'
		);
		invariant(
			typeof publicationID === 'string' && publicationID.length > 0,
			'publicationID is required and must be a string.'
		);
	},
} );

const fetchUpdatePublicationStore = createFetchStore( {
	baseName: 'updatePublication',
	controlCallback: ( params ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'publication',
			params
		),
	reducerCallback: createReducer(
		( state, publication, { organizationID, publicationID } ) => {
			state.publicationsByOrganization =
				state.publicationsByOrganization || {};
			state.publicationsByOrganization[ organizationID ] =
				state.publicationsByOrganization[ organizationID ] || {};
			state.publicationsByOrganization[ organizationID ][
				publicationID
			] = publication;
		}
	),
	argsToParams: ( params = {} ) => params,
	validateParams: ( { organizationID, publicationID, ...fields } = {} ) => {
		invariant(
			typeof organizationID === 'string' && organizationID.length > 0,
			'organizationID is required and must be a string.'
		);
		invariant(
			typeof publicationID === 'string' && publicationID.length > 0,
			'publicationID is required and must be a string.'
		);
		invariant(
			Object.keys( fields ).length > 0,
			'Publication fields are required.'
		);
	},
	isAction: true,
} );

const fetchGetTermsOfServiceStore = createFetchStore( {
	baseName: 'getTermsOfService',
	controlCallback: ( { tosURL } ) =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'terms-of-service',
			{ tosURL },
			{ useCache: false }
		),
	reducerCallback: createReducer( ( state, termsOfService, { tosURL } ) => {
		state.termsOfService = state.termsOfService || {};
		state.termsOfService[ tosURL ] = termsOfService;
	} ),
	argsToParams: ( { tosURL } = {} ) => ( { tosURL } ),
	validateParams: ( { tosURL } = {} ) => {
		invariant(
			typeof tosURL === 'string' && tosURL.length > 0,
			'tosURL is required and must be a string.'
		);
	},
} );

const fetchGetSyncPublicationOnboardingStateStore = createFetchStore( {
	baseName: 'getSyncPublicationOnboardingState',
	controlCallback: ( { publicationID, publicationOnboardingState } ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'sync-publication-onboarding-state',
			{
				publicationID,
				publicationOnboardingState,
			}
		),
	argsToParams: ( { publicationID, publicationOnboardingState } ) => {
		return { publicationID, publicationOnboardingState };
	},
	validateParams: ( { publicationID, publicationOnboardingState } = {} ) => {
		invariant(
			typeof publicationID === 'string' && publicationID.length > 0,
			'publicationID is required and must be string.'
		);

		invariant(
			typeof publicationOnboardingState === 'string' &&
				publicationOnboardingState.length > 0,
			'publicationOnboardingState is required and must be string.'
		);
	},
	reducerCallback: createReducer(
		( state, { publicationID, publicationOnboardingState } ) => {
			if ( ! publicationID ) {
				return;
			}

			// eslint-disable-next-line sitekit/no-direct-date
			const publicationOnboardingStateLastSyncedAtMs = Date.now();

			if ( state.settings.publicationID === publicationID ) {
				state.settings.publicationOnboardingState =
					publicationOnboardingState;
				state.settings.publicationOnboardingStateLastSyncedAtMs =
					publicationOnboardingStateLastSyncedAtMs;
			}

			if ( state.savedSettings.publicationID === publicationID ) {
				state.savedSettings.publicationOnboardingState =
					publicationOnboardingState;
				state.savedSettings.publicationOnboardingStateLastSyncedAtMs =
					publicationOnboardingStateLastSyncedAtMs;
			}

			const publication = state.publications?.find(
				// eslint-disable-next-line sitekit/acronym-case
				( { publicationId: id } ) => id === publicationID
			);

			if ( publication ) {
				publication.onboardingState = publicationOnboardingState;
			}
		}
	),
	isAction: true,
} );

const baseInitialState = {
	publications: undefined,
	publicationsByOrganization: {},
	termsOfService: {},
};

const baseActions = {
	/**
	 * Creates a publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} params              Publication creation parameters.
	 * @param {string} params.displayName  Publication display name.
	 * @param {string} params.languageCode Publication language code.
	 * @param {string} params.regionCode   Publication region code.
	 * @return {Object} Object with `response` and `error`.
	 */
	createPublication: createValidatedAction(
		( params ) => {
			invariant(
				isPlainObject( params ),
				'Publication details are required.'
			);
			const { displayName, languageCode, regionCode } = params;

			invariant(
				typeof displayName === 'string' && displayName.length > 0,
				'displayName is required and must be a string.'
			);
			invariant(
				typeof languageCode === 'string' && languageCode.length > 0,
				'languageCode is required and must be a string.'
			);
			invariant(
				typeof regionCode === 'string' && regionCode.length > 0,
				'regionCode is required and must be a string.'
			);
		},
		function* ( params ) {
			return yield fetchCreatePublicationStore.actions.fetchCreatePublication(
				params
			);
		}
	),

	/**
	 * Updates a publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} params                               Publication update parameters.
	 * @param {string} params.organizationID                Organization ID.
	 * @param {string} params.publicationID                 Publication ID.
	 * @param {Object} [params.rrmProduct]                  RRM product fields, including ToS acceptance.
	 * @param {string} [params.publicationTosURL]           Publication Terms of Service URL.
	 * @param {string} [params.publicationPrivacyPolicyURL] Publication privacy policy URL.
	 * @return {Object} Object with `response` and `error`.
	 */
	updatePublication: createValidatedAction(
		( params ) => {
			invariant(
				isPlainObject( params ),
				'Publication update parameters are required.'
			);
			const { organizationID, publicationID, ...fields } = params;

			invariant(
				typeof organizationID === 'string' && organizationID.length > 0,
				'organizationID is required and must be a string.'
			);
			invariant(
				typeof publicationID === 'string' && publicationID.length > 0,
				'publicationID is required and must be a string.'
			);
			invariant(
				Object.keys( fields ).length > 0,
				'Publication fields are required.'
			);
		},
		function* ( params ) {
			return yield fetchUpdatePublicationStore.actions.fetchUpdatePublication(
				params
			);
		}
	),

	/**
	 * Synchronizes the onboarding state of the publication with the API.
	 * Updates the settings on the server.
	 *
	 * @since 1.132.0
	 *
	 * @return {void}
	 */
	*syncPublicationOnboardingState() {
		const registry = yield commonActions.getRegistry();

		yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getSettings()
		);

		const publicationID = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationID();

		const publicationOnboardingState = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationOnboardingState();

		// If there is no publication ID in state, do not attempt to sync
		// the onboarding state.
		if (
			publicationID === undefined ||
			publicationOnboardingState === undefined
		) {
			return {};
		}

		return yield fetchGetSyncPublicationOnboardingStateStore.actions.fetchGetSyncPublicationOnboardingState(
			{
				publicationID,
				publicationOnboardingState,
			}
		);
	},

	/**
	 * Finds a matched publication.
	 *
	 * @since 1.132.0
	 *
	 * @return {Object|null} Matched publication; `null` if none found.
	 */
	*findMatchedPublication() {
		const { resolveSelect } = yield commonActions.getRegistry();
		const publications = yield commonActions.await(
			resolveSelect( MODULES_READER_REVENUE_MANAGER ).getPublications()
		);

		if ( publications.length === 0 ) {
			return null;
		}

		if ( publications.length === 1 ) {
			return publications[ 0 ];
		}

		const completedOnboardingPublication = publications.find(
			( publication ) =>
				publication.onboardingState ===
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
		);

		return completedOnboardingPublication || publications[ 0 ];
	},

	/**
	 * Resets the publications data in the store.
	 *
	 * @since 1.133.0
	 *
	 * @return {Object} The dispatched action results.
	 */
	*resetPublications() {
		const registry = yield commonActions.getRegistry();

		yield {
			type: 'RESET_PUBLICATIONS',
		};

		yield errorStoreActions.clearSelectorErrors( 'getPublications' );

		return registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.invalidateResolutionForStoreSelector( 'getPublications' );
	},

	/**
	 * Sets the given publication in the store.
	 *
	 * @since 1.133.0
	 *
	 * @param {Object} publication The publiation object.
	 * @return {Object} A Generator function.
	 */
	selectPublication: createValidatedAction(
		( publication ) => {
			invariant(
				isPlainObject( publication ),
				'A valid publication object is required.'
			);

			[ 'publicationId', 'onboardingState' ].forEach( ( key ) => {
				invariant(
					publication.hasOwnProperty( key ),
					`The publication object must contain ${ key }`
				);
			} );
		},
		function* ( {
			/* eslint-disable sitekit/acronym-case -- `Id` is the identifier used by the API. */
			publicationId: publicationID,
			organizationId: organizationID,
			/* eslint-enable sitekit/acronym-case */
			onboardingState,
			paymentOptions,
			products,
			contentPolicyStatus,
		} ) {
			const registry = yield commonActions.getRegistry();

			const settings = {
				publicationID,
				publicationOnboardingState: onboardingState,
				publicationOnboardingStateChanged: false,
				productIDs: getProductIDs( products ),
				paymentOption: getPaymentOption( paymentOptions ),
				productID: 'openaccess',
			};

			if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
				settings.organizationID = organizationID || '';
			}

			if ( contentPolicyStatus ) {
				settings.contentPolicyState =
					contentPolicyStatus.contentPolicyState;
				settings.policyInfoLink =
					contentPolicyStatus.policyInfoLink || '';
			}

			return registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.setSettings( settings );
		}
	),
};

const baseControls = {};

const baseReducer = createReducer( ( state, { type } ) => {
	switch ( type ) {
		case 'RESET_PUBLICATIONS':
			state.publications = baseInitialState.publications;
			break;

		default:
			break;
	}
} );

const baseResolvers = {
	*getPublications() {
		const registry = yield commonActions.getRegistry();
		// Only fetch publications if there are none in the store.
		const publications = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublications();
		if ( publications === undefined ) {
			yield fetchGetPublicationsStore.actions.fetchGetPublications();
		}
	},

	*getPublication( { organizationID, publicationID } = {} ) {
		if ( ! organizationID || ! publicationID ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const publication = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublication( { organizationID, publicationID } );

		if ( publication === undefined ) {
			yield fetchGetPublicationStore.actions.fetchGetPublication( {
				organizationID,
				publicationID,
			} );
		}
	},

	*getTermsOfService( { tosURL } = {} ) {
		if ( ! tosURL ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const termsOfService = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getTermsOfService( { tosURL } );

		if ( termsOfService === undefined ) {
			yield fetchGetTermsOfServiceStore.actions.fetchGetTermsOfService( {
				tosURL,
			} );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets list of publications associated with the account.
	 *
	 * @since 1.132.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} An array of publications; `undefined` if not loaded.
	 */
	getPublications( state ) {
		return state.publications;
	},

	/**
	 * Gets a publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state                 Data store's state.
	 * @param {Object} params                Publication parameters.
	 * @param {string} params.organizationID Organization ID.
	 * @param {string} params.publicationID  Publication ID.
	 * @return {(Object|undefined)} Publication resource; `undefined` if not loaded.
	 */
	getPublication( state, { organizationID, publicationID } = {} ) {
		if ( ! organizationID || ! publicationID ) {
			return undefined;
		}

		return state.publicationsByOrganization?.[ organizationID ]?.[
			publicationID
		];
	},

	/**
	 * Gets the Terms of Service HTML.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state         Data store's state.
	 * @param {Object} params        Terms of Service parameters.
	 * @param {string} params.tosURL Terms of Service URL.
	 * @return {(string|undefined)} Terms of Service HTML; `undefined` if not loaded.
	 */
	getTermsOfService( state, { tosURL } = {} ) {
		if ( ! tosURL ) {
			return undefined;
		}

		return state.termsOfService?.[ tosURL ];
	},

	/**
	 * Gets the current publication IDs.
	 *
	 * @since 1.150.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<string> | undefined)} An array of product IDs; `undefined` if publications are not loaded.
	 */
	getCurrentProductIDs: createRegistrySelector( ( select ) => ( state ) => {
		const publications = select(
			MODULES_READER_REVENUE_MANAGER
		).getPublications();

		if ( publications === undefined ) {
			return undefined;
		}

		const publicationID = select(
			MODULES_READER_REVENUE_MANAGER
		).getPublicationID();

		if ( ! publicationID ) {
			return [];
		}

		const selectedPublication = state.publications.find(
			// eslint-disable-next-line sitekit/acronym-case
			( { publicationId: id } ) => id === publicationID
		);

		if ( ! selectedPublication || ! selectedPublication.products ) {
			return [];
		}

		return selectedPublication.products.map( ( product ) => product.name );
	} ),

	/**
	 * Gets the policy info URL wrapped with the account chooser URL.
	 *
	 * @since 1.171.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The policy info URL wrapped with the account chooser URL; `null` if `policyInfoLink` is empty; `undefined` if not available.
	 */
	getPolicyInfoURL: createRegistrySelector( ( select ) => () => {
		const settings = select( MODULES_READER_REVENUE_MANAGER ).getSettings();

		if ( ! settings ) {
			return undefined;
		}

		const { policyInfoLink } = settings;

		if ( policyInfoLink === undefined ) {
			return undefined;
		}

		if ( ! policyInfoLink ) {
			return null;
		}

		return select( CORE_USER ).getAccountChooserURL( policyInfoLink );
	} ),
};

const store = combineStores(
	fetchGetPublicationsStore,
	fetchCreatePublicationStore,
	fetchGetPublicationStore,
	fetchUpdatePublicationStore,
	fetchGetTermsOfServiceStore,
	fetchGetSyncPublicationOnboardingStateStore,
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
