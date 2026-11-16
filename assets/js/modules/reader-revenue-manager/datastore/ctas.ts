/**
 * `modules/reader-revenue-manager` data store: CTAs.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Internal dependencies
 */
import { get, set } from 'googlesitekit-api';
import {
	Select,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import {
	combineStores,
	createValidatedAction,
} from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { getCTAID } from '@/js/modules/reader-revenue-manager/utils/ctas';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from './constants';
import {
	type CTA,
	CTA_STATES,
	type CreateCTAData,
	getCTATypeHandler,
	isCTAState,
	isCTAType,
} from './cta-types';
import {
	type Publication,
	type PublicationParams,
	getSelectedPublicationID,
	maybeResolveSettings,
	validateOptionalPublicationParams,
} from './publications';
import { type ConfiguredCTA, type ReaderRevenueManagerSettings } from './types';

export type CreateCTAParams = Partial< PublicationParams > & {
	data: CreateCTAData;
};
interface CTAsState {
	ctas: Record< string, CTA[] | undefined >;
	settings?: ReaderRevenueManagerSettings;
	savedSettings?: ReaderRevenueManagerSettings;
}

type Registry = WPDataRegistry & {
	resolveSelect: WPDataRegistry[ 'select' ];
};

/**
 * Syncs configured CTAs into settings and savedSettings.
 *
 * @since 1.188.0
 * @since 1.192.0 Stores the type, state and display name of each CTA.
 * @since n.e.x.t Only updates the settings that hold the CTAs' publication.
 *
 * @param {Object} state         Module state.
 * @param {string} publicationID Publication the CTAs belong to.
 * @param {Array}  ctas          CTAs to sync from.
 * @return {void}
 */
function syncConfiguredCTAs(
	state: CTAsState,
	publicationID: string,
	ctas: CTA[]
): void {
	const configuredCTAs = ctas.reduce< Record< string, ConfiguredCTA > >(
		( accumulator, cta ) => {
			const ctaID = getCTAID( cta.name );
			const ctaTypeSlug =
				cta.type in EXPRESS_SETUP_CTAS
					? EXPRESS_SETUP_CTAS[
							cta.type as keyof typeof EXPRESS_SETUP_CTAS
					  ]
					: undefined;

			if ( ctaID && ctaTypeSlug && isCTAState( cta.state ) ) {
				accumulator[ ctaID ] = {
					type: ctaTypeSlug,
					state: cta.state,
					displayName: cta.displayName || '',
				};
			}

			return accumulator;
		},
		{}
	);

	if ( state.settings?.publicationID === publicationID ) {
		state.settings.configuredCTAs = configuredCTAs;
	}

	if ( state.savedSettings?.publicationID === publicationID ) {
		state.savedSettings.configuredCTAs = configuredCTAs;
	}
}

/**
 * Validates the identifiers of the publication to list the CTAs of.
 *
 * @since n.e.x.t
 *
 * @param  params Publication parameters to validate.
 * @return {void}
 */
function validatePublicationParams(
	params: Partial< PublicationParams > = {}
): void {
	const { organizationID, publicationID } = params;

	invariant(
		typeof organizationID === 'string' && organizationID.length > 0,
		'organizationID is required and must be a non-empty string.'
	);
	invariant(
		typeof publicationID === 'string' && publicationID.length > 0,
		'publicationID is required and must be a non-empty string.'
	);
}

/**
 * Finds the selected publication's identifiers.
 *
 * Settings saved before express setup have a publication ID but no
 * organization ID. Its organization ID is then read from the publications
 * list, which has to be loaded for it.
 *
 * @since n.e.x.t
 *
 * @param {Function} select Registry `select` function.
 * @return {(Object|null|undefined)} Publication identifiers; `null` if no publication is selected; `undefined` while loading.
 */
function findPublicationParams(
	select: Select
): PublicationParams | null | undefined {
	const settings: ReaderRevenueManagerSettings | undefined = select(
		MODULES_READER_REVENUE_MANAGER
	).getSettings();

	if ( settings === undefined ) {
		return undefined;
	}

	const { publicationID, organizationID } = settings;

	if ( ! publicationID ) {
		return null;
	}

	if ( organizationID ) {
		return { organizationID, publicationID };
	}

	const publications: Publication[] | undefined = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublications();

	if ( publications === undefined ) {
		return undefined;
	}

	const publication = publications.find(
		// eslint-disable-next-line sitekit/acronym-case
		( { publicationId: id } ) => id === publicationID
	);

	// eslint-disable-next-line sitekit/acronym-case
	if ( ! publication?.organizationId ) {
		return null;
	}

	// eslint-disable-next-line sitekit/acronym-case
	return { organizationID: publication.organizationId, publicationID };
}

/**
 * Resolves the selected publication's identifiers.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Data registry.
 * @return {Promise<(Object|null)>} Publication identifiers; `null` if no publication is selected.
 */
async function resolvePublicationParams(
	registry: Registry
): Promise< PublicationParams | null > {
	await registry
		.resolveSelect( MODULES_READER_REVENUE_MANAGER )
		.getSettings();

	const params = findPublicationParams( registry.select as Select );

	if ( params !== undefined ) {
		return params;
	}

	// Legacy settings: load the publications list for the organization ID.
	await registry
		.resolveSelect( MODULES_READER_REVENUE_MANAGER )
		.getPublications();

	return findPublicationParams( registry.select as Select ) ?? null;
}

/**
 * Validates the CTA creation parameters.
 *
 * @since 1.187.0
 *
 * @param  params Parameters to validate.
 * @return {void}
 */
function validateCreateCTAParams( params: unknown ): void {
	invariant( isPlainObject( params ), 'params must be an object.' );

	const createParams = params as Partial< CreateCTAParams >;

	validateOptionalPublicationParams( createParams );

	const { data } = createParams;

	invariant(
		isPlainObject( data ) && Object.keys( data as object ).length > 0,
		'data is required and must be a non-empty object.'
	);

	const { type, config, displayName, state } = data as Record<
		string,
		unknown
	>;

	invariant( isCTAType( type ), 'data.type is not supported.' );

	invariant(
		state === undefined || isCTAState( state ),
		'data.state is not supported.'
	);

	invariant(
		displayName === undefined || typeof displayName === 'string',
		'data.displayName must be a string.'
	);

	getCTATypeHandler( type ).validateConfig( config );
}

const fetchGetCTAsStore = createFetchStore( {
	baseName: 'getPublicationCTAs',
	controlCallback: ( { organizationID, publicationID }: PublicationParams ) =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'ctas',
			{ organizationID, publicationID },
			{ useCache: false }
		),
	reducerCallback: createReducer(
		(
			state: CTAsState,
			ctas: CTA[],
			{ publicationID }: PublicationParams
		) => {
			state.ctas[ publicationID ] = ctas;

			// Update settings states with configured CTAs.
			if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
				syncConfiguredCTAs( state, publicationID, ctas );
			}
		}
	),
	// Positional, like the selector's resolver, so that a fetch error is
	// recorded under the resolution that a retry invalidates.
	argsToParams: ( organizationID?: string, publicationID?: string ) => ( {
		organizationID,
		publicationID,
	} ),
	validateParams: validatePublicationParams,
} );

const fetchCreateCTAStore = createFetchStore( {
	baseName: 'createCTA',
	controlCallback: ( params: CreateCTAParams ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'create-cta',
			params
		),
	reducerCallback: createReducer(
		( state: CTAsState, cta: CTA, params: CreateCTAParams ) => {
			const selectedPublicationID = getSelectedPublicationID(
				state,
				params
			);

			// Only extend an already loaded list, otherwise the resolver would
			// treat the single created CTA as the complete set.
			if (
				! selectedPublicationID ||
				state.ctas[ selectedPublicationID ] === undefined
			) {
				return;
			}

			state.ctas[ selectedPublicationID ].push( cta );
		}
	),
	argsToParams: ( params: CreateCTAParams ) => params,
	validateParams: validateCreateCTAParams,
	isAction: true,
} );

const baseInitialState: CTAsState = {
	ctas: {},
};

const baseActions = {
	/**
	 * Creates a CTA for the given publication.
	 *
	 * @since 1.187.0
	 * @since 1.189.0 Added support for the CTA `state` property. Defaults to `ACTIVE`.
	 *
	 * @param  params                  Parameters.
	 * @param  params.organizationID   Optional. Organization ID. Defaults to the configured setting on the server.
	 * @param  params.publicationID    Optional. Publication ID. Defaults to the configured setting on the server.
	 * @param  params.data             CTA data.
	 * @param  params.data.type        CTA type.
	 * @param  params.data.config      Type-specific CTA configuration.
	 * @param  params.data.state       Optional. CTA state (`ACTIVE` or `DRAFT`). Defaults to `ACTIVE`.
	 * @param  params.data.displayName Optional. Internal display name.
	 * @return {Object} Object with `response` and `error`.
	 */
	createCTA: createValidatedAction(
		validateCreateCTAParams,
		function* (
			params: CreateCTAParams
		): Generator< unknown, unknown, unknown > {
			const registryResult = yield commonActions.getRegistry();
			const registry = registryResult as Registry;

			// Resolve settings so that the store has the publication ID to key the list by.
			const settingsResolution = maybeResolveSettings( registry, params );

			if ( settingsResolution ) {
				yield commonActions.await( settingsResolution );
			}

			// @ts-expect-error createFetchStore is not properly typed yet.
			return yield fetchCreateCTAStore.actions.fetchCreateCTA( {
				...params,
				data: {
					...params.data,
					state: params.data.state ?? CTA_STATES.ACTIVE,
				},
			} );
		}
	),

	/**
	 * Requests the selected publication's CTAs again, replacing the stored ones.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*refreshCTAs(): Generator< unknown, unknown, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		const publicationParams = ( yield commonActions.await(
			resolvePublicationParams( registry )
		) ) as PublicationParams | null;

		if ( ! publicationParams ) {
			return { response: undefined, error: undefined };
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		return yield fetchGetCTAsStore.actions.fetchGetPublicationCTAs(
			publicationParams.organizationID,
			publicationParams.publicationID
		);
	},
};

const baseResolvers = {
	*getCTAs(): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		// Lets `resolveSelect` wait for the selected publication's CTAs.
		// Selecting them requests them through `getPublicationCTAs()`.
		const publicationParams = ( yield commonActions.await(
			resolvePublicationParams( registry )
		) ) as PublicationParams | null;

		if ( publicationParams ) {
			yield commonActions.await(
				registry
					.resolveSelect( MODULES_READER_REVENUE_MANAGER )
					.getPublicationCTAs(
						publicationParams.organizationID,
						publicationParams.publicationID
					)
			);
		}
	},

	*getPublicationCTAs(
		organizationID: string,
		publicationID: string
	): Generator< unknown, void, unknown > {
		if ( ! organizationID || ! publicationID ) {
			return;
		}

		const registry = ( yield commonActions.getRegistry() ) as Registry;

		const ctas = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationCTAs( organizationID, publicationID );

		if ( ctas !== undefined ) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetCTAsStore.actions.fetchGetPublicationCTAs(
			organizationID,
			publicationID
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the CTAs of the selected publication.
	 *
	 * @since 1.187.0
	 * @since n.e.x.t Returns the selected publication's CTAs; no longer accepts publication identifiers.
	 *
	 * @return {(Array.<Object>|undefined)} The CTAs; `undefined` if not loaded yet or no publication is selected.
	 */
	getCTAs: createRegistrySelector(
		( select: Select ) => (): CTA[] | undefined => {
			const params = findPublicationParams( select );

			if ( ! params ) {
				return undefined;
			}

			return select( MODULES_READER_REVENUE_MANAGER ).getPublicationCTAs(
				params.organizationID,
				params.publicationID
			);
		}
	),

	/**
	 * Gets the CTAs of a publication.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param  state          Data store's state.
	 * @param  organizationID Organization ID. Requests are made for it; CTAs are stored by publication ID.
	 * @param  publicationID  Publication ID.
	 * @return {(Array.<Object>|undefined)} The CTAs; `undefined` if not loaded yet.
	 */
	getPublicationCTAs(
		state: CTAsState,
		organizationID: string,
		publicationID: string
	): CTA[] | undefined {
		return state.ctas[ publicationID ];
	},
};

interface Store {
	initialState: CTAsState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores( fetchGetCTAsStore, fetchCreateCTAStore, {
	initialState: baseInitialState,
	actions: baseActions,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} ) as Store;

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
