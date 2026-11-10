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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies.
 */
import { get, set } from 'googlesitekit-api';
import {
	Select,
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
import { type ReaderRevenueManagerSettings } from './types';

export interface Publication {
	/* eslint-disable sitekit/acronym-case -- `Id` is the identifier used by the API. */
	publicationId: string;
	organizationId?: string;
	/* eslint-enable sitekit/acronym-case */
	displayName: string;
	onboardingState: string;
	publicationType?: string;
	paymentOptions?: Record< string, boolean >;
	products?: Array< { name: string } >;
	contentPolicyStatus?: {
		contentPolicyState: string;
		policyInfoLink?: string;
	};
	languageCode?: string;
	regionCode?: string;
	rrmProduct?: {
		// eslint-disable-next-line sitekit/acronym-case -- `Url` is the normalized API field name.
		productTosUrl?: string;
		tosAcceptance?: {
			emailOptIn?: boolean;
			userAccepted: boolean;
		};
	};
	/* eslint-disable sitekit/acronym-case -- `Url` is the identifier used by the API. */
	publicationTosUrl?: string;
	publicationPrivacyPolicyUrl?: string;
	/* eslint-enable sitekit/acronym-case */
}

interface ReaderRevenueManagerState {
	publications: Publication[] | undefined;
	settings: ReaderRevenueManagerSettings;
	savedSettings: ReaderRevenueManagerSettings;
}

interface CreatePublicationParams {
	displayName: string;
	languageCode: string;
	regionCode: string;
}

export interface UpdatePublicationParams {
	data: Record< string, unknown >;
}

interface SyncPublicationOnboardingStateParams {
	publicationID: string;
	publicationOnboardingState: string;
}

type ReaderRevenueManagerRegistry = WPDataRegistry & {
	resolveSelect: WPDataRegistry[ 'select' ];
};

/**
 * Syncs connected publication fields into settings and savedSettings.
 *
 * @since 1.188.0
 *
 * @param {Object} state       Module state.
 * @param {Object} publication Publication to sync from.
 * @return {void}
 */
function syncConnectedPublicationSettings(
	state: ReaderRevenueManagerState,
	publication: Publication
): void {
	if (
		! state.settings?.publicationID ||
		// eslint-disable-next-line sitekit/acronym-case
		publication.publicationId !== state.settings.publicationID
	) {
		return;
	}

	const newSettings: ReaderRevenueManagerSettings = {
		publicationOnboardingState: publication.onboardingState,
		productIDs: getProductIDs( publication.products! ),
		paymentOption: getPaymentOption( publication.paymentOptions! ),
	};

	if ( publication.contentPolicyStatus ) {
		newSettings.contentPolicyState =
			publication.contentPolicyStatus.contentPolicyState;
		newSettings.policyInfoLink =
			publication.contentPolicyStatus.policyInfoLink || '';
	}

	if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
		// eslint-disable-next-line sitekit/acronym-case
		newSettings.organizationID = publication.organizationId || '';
	}

	Object.assign( state.settings, newSettings );

	if ( state.savedSettings ) {
		Object.assign( state.savedSettings, newSettings );
	}
}

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
	reducerCallback: createReducer(
		( state: ReaderRevenueManagerState, publications: Publication[] ) => {
			state.publications = publications;

			const publication = publications?.find(
				// eslint-disable-next-line sitekit/acronym-case
				( { publicationId: id } ) =>
					id === state.settings?.publicationID
			);

			if ( publication ) {
				syncConnectedPublicationSettings( state, publication );
			}
		}
	),
} );

const fetchPublicationStoreReducerCallback = createReducer(
	( state: ReaderRevenueManagerState, publication: Publication ) => {
		state.publications = state.publications || [];
		// eslint-disable-next-line sitekit/acronym-case -- `Id` is the identifier used by the API.
		const publicationID = publication.publicationId;

		const publicationIndex = state.publications.findIndex(
			// eslint-disable-next-line sitekit/acronym-case
			( { publicationId: id } ) => id === publicationID
		);

		if ( publicationIndex === -1 ) {
			state.publications.push( publication );
		} else {
			state.publications[ publicationIndex ] = publication;
		}

		syncConnectedPublicationSettings( state, publication );
	}
);

const fetchCreatePublicationStore = createFetchStore( {
	baseName: 'createPublication',
	reducerCallback: fetchPublicationStoreReducerCallback,
	controlCallback: ( {
		displayName,
		languageCode,
		regionCode,
	}: CreatePublicationParams ) =>
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
	argsToParams: ( {
		displayName,
		languageCode,
		regionCode,
	}: Partial< CreatePublicationParams > = {} ) => ( {
		displayName,
		languageCode,
		regionCode,
	} ),
	validateParams: ( {
		displayName,
		languageCode,
		regionCode,
	}: Partial< CreatePublicationParams > = {} ) => {
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
	controlCallback: () =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'publication',
			{},
			{ useCache: false }
		),
	reducerCallback: fetchPublicationStoreReducerCallback,
} );

const fetchUpdatePublicationStore = createFetchStore( {
	baseName: 'updatePublication',
	controlCallback: ( { data }: UpdatePublicationParams ) =>
		set( 'modules', MODULE_SLUG_READER_REVENUE_MANAGER, 'publication', {
			data,
		} ),
	reducerCallback: fetchPublicationStoreReducerCallback,
	argsToParams: ( { data }: Partial< UpdatePublicationParams > = {} ) => ( {
		data,
	} ),
	validateParams: ( { data }: Partial< UpdatePublicationParams > = {} ) => {
		invariant(
			isPlainObject( data ) &&
				Object.keys( data as Record< string, unknown > ).length > 0,
			'data is required and must be a non-empty object.'
		);
	},
	isAction: true,
} );

const fetchGetSyncPublicationOnboardingStateStore = createFetchStore( {
	baseName: 'getSyncPublicationOnboardingState',
	controlCallback: ( {
		publicationID,
		publicationOnboardingState,
	}: SyncPublicationOnboardingStateParams ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'sync-publication-onboarding-state',
			{
				publicationID,
				publicationOnboardingState,
			}
		),
	argsToParams: ( {
		publicationID,
		publicationOnboardingState,
	}: SyncPublicationOnboardingStateParams ) => {
		return { publicationID, publicationOnboardingState };
	},
	validateParams: ( {
		publicationID,
		publicationOnboardingState,
	}: Partial< SyncPublicationOnboardingStateParams > = {} ) => {
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
		(
			state: ReaderRevenueManagerState,
			{
				publicationID,
				publicationOnboardingState,
			}: SyncPublicationOnboardingStateParams
		) => {
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

const baseInitialState: Pick< ReaderRevenueManagerState, 'publications' > = {
	publications: undefined,
};

const baseActions = {
	/**
	 * Creates a publication.
	 *
	 * @since 1.186.0
	 *
	 * @param {Object} params              Publication creation parameters.
	 * @param {string} params.displayName  Publication display name.
	 * @param {string} params.languageCode Publication language code.
	 * @param {string} params.regionCode   Publication region code.
	 * @return {Object} Object with `response` and `error`.
	 */
	createPublication: createValidatedAction(
		( params: unknown ) => {
			invariant( isPlainObject( params ), 'params must be an object.' );
			const { displayName, languageCode, regionCode } =
				params as Partial< CreatePublicationParams >;
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
		function* (
			params: CreatePublicationParams
		): Generator< unknown, unknown, unknown > {
			// @ts-expect-error createFetchStore is not properly typed yet.
			return yield fetchCreatePublicationStore.actions.fetchCreatePublication(
				params
			);
		}
	),

	/**
	 * Updates the connected publication.
	 *
	 * @since 1.186.0
	 * @since n.e.x.t Acts on the connected publication; no longer accepts publication identifiers.
	 *
	 * @param {Object} params      Publication update parameters.
	 * @param {Object} params.data Publication fields to update.
	 * @return {Object} Object with `response` and `error`.
	 */
	updatePublication: createValidatedAction(
		( params: unknown ) => {
			invariant( isPlainObject( params ), 'params must be an object.' );

			const { data } = params as Partial< UpdatePublicationParams >;

			invariant(
				isPlainObject( data ) &&
					Object.keys( data as Record< string, unknown > ).length > 0,
				'data is required and must be a non-empty object.'
			);
		},
		function* ( {
			data,
		}: UpdatePublicationParams ): Generator< unknown, unknown, unknown > {
			// @ts-expect-error createFetchStore is not properly typed yet.
			return yield fetchUpdatePublicationStore.actions.fetchUpdatePublication(
				{ data }
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
	*syncPublicationOnboardingState(): Generator< unknown, unknown, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as ReaderRevenueManagerRegistry;

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

		// @ts-expect-error createFetchStore is not properly typed yet.
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
	*findMatchedPublication(): Generator<
		unknown,
		Publication | null,
		unknown
	> {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as ReaderRevenueManagerRegistry;
		const publicationsResult = yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getPublications()
		);
		const publications = publicationsResult as Publication[];

		if ( ! publications ) {
			return null;
		}

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
	*resetPublications(): Generator< unknown, unknown, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

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
		( publication: unknown ) => {
			invariant(
				isPlainObject( publication ),
				'A valid publication object is required.'
			);

			[ 'publicationId', 'onboardingState' ].forEach( ( key ) => {
				invariant(
					( publication as Record< string, unknown > ).hasOwnProperty(
						key
					),
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
		}: Publication ): Generator< unknown, unknown, unknown > {
			const registryResult = yield commonActions.getRegistry();
			const registry = registryResult as WPDataRegistry;

			const settings: ReaderRevenueManagerSettings = {
				publicationID,
				publicationOnboardingState: onboardingState,
				publicationOnboardingStateChanged: false,
				productIDs: getProductIDs( products! ),
				paymentOption: getPaymentOption( paymentOptions! ),
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

const baseReducer = createReducer(
	( state: ReaderRevenueManagerState, { type }: { type: string } ) => {
		switch ( type ) {
			case 'RESET_PUBLICATIONS':
				state.publications = baseInitialState.publications;
				break;

			default:
				break;
		}
	}
);

const baseResolvers = {
	*getPublications(): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;
		// Only fetch publications if there are none in the store.
		const publications = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublications();
		if ( publications === undefined ) {
			// @ts-expect-error createFetchStore is not properly typed yet.
			yield fetchGetPublicationsStore.actions.fetchGetPublications();
		}
	},

	*getPublication(): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as ReaderRevenueManagerRegistry;

		// The saved publication ID decides whether to fetch, so wait for the
		// settings before reading it.
		yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getSettings()
		);

		const publication = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublication();

		if ( publication !== undefined ) {
			return;
		}

		// No connected publication to look up; skip the fetch rather than
		// looping on `undefined`.
		if (
			! registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSavedPublicationID()
		) {
			return;
		}

		if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
			// Legacy settings (saved before express setup) have a publication ID
			// but no organization ID. The publications list synchronizes the
			// connected publication's organization ID into settings, so resolve
			// it first rather than requesting a publication the server cannot
			// identify.
			const organizationID = registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSavedOrganizationID();

			if ( ! organizationID ) {
				yield commonActions.await(
					registry
						.resolveSelect( MODULES_READER_REVENUE_MANAGER )
						.getPublications()
				);

				const resolvedPublication = registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublication();

				if ( resolvedPublication !== undefined ) {
					return;
				}
			}
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetPublicationStore.actions.fetchGetPublication();
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
	getPublications( state: ReaderRevenueManagerState ) {
		return state.publications;
	},

	/**
	 * Gets the connected publication.
	 *
	 * @since 1.186.0
	 * @since n.e.x.t Returns the connected publication; no longer accepts publication identifiers.
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Publication resource; `undefined` if not loaded.
	 */
	getPublication( state: ReaderRevenueManagerState ) {
		const publicationID = state.savedSettings?.publicationID;

		if ( ! publicationID ) {
			return undefined;
		}

		return state.publications?.find(
			// eslint-disable-next-line sitekit/acronym-case
			( { publicationId: id } ) => id === publicationID
		);
	},

	/**
	 * Gets the publication ID of the connected publication.
	 *
	 * Unlike `getPublicationID()`, this returns the saved value, so it does
	 * not change while a publisher is picking a different publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Publication ID; `undefined` if the settings are not loaded or none is saved.
	 */
	getSavedPublicationID( state: ReaderRevenueManagerState ) {
		return state.savedSettings?.publicationID;
	},

	/**
	 * Gets the organization ID of the connected publication.
	 *
	 * Unlike `getOrganizationID()`, this returns the saved value, which is the
	 * one the server builds its requests from.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} Organization ID; `undefined` if the settings are not loaded or none is saved.
	 */
	getSavedOrganizationID( state: ReaderRevenueManagerState ) {
		return state.savedSettings?.organizationID;
	},

	/**
	 * Gets the current publication IDs.
	 *
	 * @since 1.150.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<string> | undefined)} An array of product IDs; `undefined` if publications are not loaded.
	 */
	getCurrentProductIDs: createRegistrySelector(
		( select: Select ) => ( state: ReaderRevenueManagerState ) => {
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

			const selectedPublication = state.publications!.find(
				// eslint-disable-next-line sitekit/acronym-case
				( { publicationId: id } ) => id === publicationID
			);

			if ( ! selectedPublication || ! selectedPublication.products ) {
				return [];
			}

			return selectedPublication.products.map(
				( product ) => product.name
			);
		}
	),

	/**
	 * Gets the policy info URL wrapped with the account chooser URL.
	 *
	 * @since 1.171.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The policy info URL wrapped with the account chooser URL; `null` if `policyInfoLink` is empty; `undefined` if not available.
	 */
	getPolicyInfoURL: createRegistrySelector(
		( select: Select ) => (): string | null | undefined => {
			const settings = select(
				MODULES_READER_REVENUE_MANAGER
			).getSettings();

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
		}
	),
};

interface Store {
	initialState: typeof baseInitialState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores(
	fetchGetPublicationsStore,
	fetchCreatePublicationStore,
	fetchGetPublicationStore,
	fetchUpdatePublicationStore,
	fetchGetSyncPublicationOnboardingStateStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
