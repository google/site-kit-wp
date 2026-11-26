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
	type PublicationParams,
	validatePublicationParams,
} from './publications';
import { type ConfiguredCTA, type ReaderRevenueManagerSettings } from './types';

export type CreateCTAParams = {
	data: CreateCTAData;
};

type CreateCTARequest = PublicationParams & CreateCTAParams;

type GetCTAParams = PublicationParams & {
	ctaID: string;
};

interface CTAsState {
	ctas: Record< string, CTA[] | undefined >;
	ctasByID: Record< string, Record< string, CTA | null > >;
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
 *
 * @param {Object} state Module state.
 * @param {Array}  ctas  CTAs to sync from.
 * @return {void}
 */
function syncConfiguredCTAs( state: CTAsState, ctas: CTA[] ): void {
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

	if ( state.settings ) {
		state.settings.configuredCTAs = configuredCTAs;
	}

	if ( state.savedSettings ) {
		state.savedSettings.configuredCTAs = configuredCTAs;
	}
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

	const { data } = params as Partial< CreateCTAParams >;

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

const fetchGetPublicationCTAsStore = createFetchStore( {
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

			state.ctasByID[ publicationID ] ??= {};

			ctas.forEach( ( cta ) => {
				const ctaID = getCTAID( cta.name );

				if ( ctaID ) {
					state.ctasByID[ publicationID ][ ctaID ] = cta;
				}
			} );

			// Only the saved publication's CTAs belong in the settings.
			if (
				isFeatureEnabled( 'rrmExpressSetup' ) &&
				publicationID === state.savedSettings?.publicationID
			) {
				syncConfiguredCTAs( state, ctas );
			}
		}
	),
	argsToParams: (
		organizationID: string,
		publicationID: string
	): PublicationParams => ( { organizationID, publicationID } ),
	validateParams: validatePublicationParams,
} );

const fetchGetPublicationCTAStore = createFetchStore( {
	baseName: 'getPublicationCTA',
	controlCallback: async ( {
		organizationID,
		publicationID,
		ctaID,
	}: GetCTAParams ) => {
		try {
			return await get(
				'modules',
				MODULE_SLUG_READER_REVENUE_MANAGER,
				'cta',
				{ organizationID, publicationID, ctaID },
				{ useCache: false }
			);
		} catch ( error ) {
			// A CTA that does not exist is returned as `null`, so `getCTA()` can
			// tell it apart from one that is still loading, without an error
			// notice offering to retry it.
			if ( ( error as { code?: unknown } )?.code === 404 ) {
				return null;
			}

			throw error;
		}
	},
	reducerCallback: createReducer(
		(
			state: CTAsState,
			cta: CTA | null,
			{ publicationID, ctaID }: GetCTAParams
		) => {
			state.ctasByID[ publicationID ] ??= {};
			state.ctasByID[ publicationID ][ ctaID ] = cta;
		}
	),
	argsToParams: (
		organizationID: string,
		publicationID: string,
		ctaID: string
	): GetCTAParams => ( { organizationID, publicationID, ctaID } ),
	validateParams: ( params: Partial< GetCTAParams > = {} ) => {
		validatePublicationParams( params );

		invariant(
			typeof params.ctaID === 'string' && params.ctaID.length > 0,
			'ctaID is required and must be a non-empty string.'
		);
	},
} );

const fetchCreateCTAStore = createFetchStore( {
	baseName: 'createCTA',
	controlCallback: ( params: CreateCTARequest ) =>
		set(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'create-cta',
			params
		),
	reducerCallback: createReducer(
		( state: CTAsState, cta: CTA, { publicationID }: CreateCTARequest ) => {
			const ctaID = getCTAID( cta.name );

			if ( ctaID ) {
				state.ctasByID[ publicationID ] ??= {};
				state.ctasByID[ publicationID ][ ctaID ] = cta;
			}

			// Only extend an already loaded list, otherwise the resolver would
			// treat the single created CTA as the complete set.
			if ( state.ctas[ publicationID ] === undefined ) {
				return;
			}

			state.ctas[ publicationID ].push( cta );
		}
	),
	argsToParams: ( params: CreateCTARequest ) => params,
	validateParams: validateCreateCTAParams,
	isAction: true,
} );

const baseInitialState: CTAsState = {
	ctas: {},
	ctasByID: {},
};

const baseActions = {
	/**
	 * Creates a CTA for the publication in the module settings.
	 *
	 * @since 1.187.0
	 * @since 1.189.0 Added support for the CTA `state` property. Defaults to `ACTIVE`.
	 * @since 1.193.0 No longer accepts publication identifiers.
	 *
	 * @param  params                  Parameters.
	 * @param  params.data             CTA data.
	 * @param  params.data.type        CTA type.
	 * @param  params.data.config      Type-specific CTA configuration.
	 * @param  params.data.state       Optional. CTA state (`ACTIVE` or `DRAFT`). Defaults to `ACTIVE`.
	 * @param  params.data.displayName Optional. Internal display name.
	 * @return {Object} Object with `response` and `error`.
	 */
	createCTA: createValidatedAction(
		validateCreateCTAParams,
		function* ( {
			data,
		}: CreateCTAParams ): Generator< unknown, unknown, unknown > {
			const registryResult = yield commonActions.getRegistry();
			const registry = registryResult as Registry;

			const params = ( yield commonActions.await(
				registry
					.resolveSelect( MODULES_READER_REVENUE_MANAGER )
					.getPublicationParams()
			) ) as PublicationParams | null;

			if ( ! params ) {
				return {};
			}

			// @ts-expect-error createFetchStore is not properly typed yet.
			return yield fetchCreateCTAStore.actions.fetchCreateCTA( {
				...params,
				data: {
					...data,
					state: data.state ?? CTA_STATES.ACTIVE,
				},
			} );
		}
	),

	/**
	 * Requests the CTAs of the publication in the module settings again.
	 *
	 * The resolver does nothing once the store holds the CTAs, so this is how
	 * a caller refreshes them after creating one.
	 *
	 * @since 1.193.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*refreshCTAs(): Generator< unknown, unknown, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as Registry;

		const params = ( yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getPublicationParams()
		) ) as PublicationParams | null;

		if ( ! params ) {
			return {};
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		return yield fetchGetPublicationCTAsStore.actions.fetchGetPublicationCTAs(
			params.organizationID,
			params.publicationID
		);
	},
};

const baseResolvers = {
	*getPublicationCTAs(
		organizationID: string,
		publicationID: string
	): Generator< unknown, void, unknown > {
		if ( ! organizationID || ! publicationID ) {
			return;
		}

		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as Registry;

		const ctas = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationCTAs( organizationID, publicationID );

		if ( ctas !== undefined ) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetPublicationCTAsStore.actions.fetchGetPublicationCTAs(
			organizationID,
			publicationID
		);
	},

	*getPublicationCTA(
		organizationID: string,
		publicationID: string,
		ctaID: string
	): Generator< unknown, void, unknown > {
		if ( ! organizationID || ! publicationID || ! ctaID ) {
			return;
		}

		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as Registry;

		const cta = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationCTA( organizationID, publicationID, ctaID );

		if ( cta !== undefined ) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetPublicationCTAStore.actions.fetchGetPublicationCTA(
			organizationID,
			publicationID,
			ctaID
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the CTAs of the publication in the module settings.
	 *
	 * @since 1.187.0
	 * @since 1.193.0 No longer accepts publication identifiers.
	 *
	 * @return {(Array.<Object>|undefined)} The CTAs; `undefined` if not loaded yet.
	 */
	getCTAs: createRegistrySelector(
		( select: Select ) => (): CTA[] | undefined => {
			const params = select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationParams();

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
	 * The CTAs are stored under their publication ID, and the resolution is
	 * keyed the same way, so changing the publication requests the new one's
	 * CTAs on its own.
	 *
	 * The organization only addresses the request, so the CTAs are not stored
	 * under it.
	 *
	 * @since 1.193.0
	 * @private
	 *
	 * @param  state           Data store's state.
	 * @param  _organizationID Organization ID.
	 * @param  publicationID   Publication ID.
	 * @return {(Array.<Object>|undefined)} The CTAs; `undefined` if not loaded yet.
	 */
	getPublicationCTAs(
		state: CTAsState,
		_organizationID: string,
		publicationID: string
	): CTA[] | undefined {
		return state.ctas[ publicationID ];
	},

	/**
	 * Gets a CTA of the publication in the module settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} ctaID CTA ID.
	 * @return {(Object|null|undefined)} The CTA; `null` if it does not exist; `undefined` if not loaded yet.
	 */
	getCTA: createRegistrySelector(
		( select: Select ) =>
			( _state: CTAsState, ctaID: string ): CTA | null | undefined => {
				invariant(
					typeof ctaID === 'string' && ctaID.length > 0,
					'ctaID is required and must be a non-empty string.'
				);

				const params = select(
					MODULES_READER_REVENUE_MANAGER
				).getPublicationParams();

				if ( ! params ) {
					return undefined;
				}

				return select(
					MODULES_READER_REVENUE_MANAGER
				).getPublicationCTA(
					params.organizationID,
					params.publicationID,
					ctaID
				);
			}
	),

	/**
	 * Gets a CTA of a publication.
	 *
	 * The CTAs are stored under their publication ID and then their CTA ID,
	 * and the resolution is keyed the same way, so changing the publication
	 * requests the new one's CTA on its own.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state           Data store's state.
	 * @param {string} _organizationID Organization ID.
	 * @param {string} publicationID   Publication ID.
	 * @param {string} ctaID           CTA ID.
	 * @return {(Object|null|undefined)} The CTA; `null` if it does not exist; `undefined` if not loaded yet.
	 */
	getPublicationCTA(
		state: CTAsState,
		_organizationID: string,
		publicationID: string,
		ctaID: string
	): CTA | null | undefined {
		return state.ctasByID[ publicationID ]?.[ ctaID ];
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

const store = combineStores(
	fetchGetPublicationCTAsStore,
	fetchGetPublicationCTAStore,
	fetchCreateCTAStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
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
