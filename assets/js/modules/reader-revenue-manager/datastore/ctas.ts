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
import { commonActions, createReducer } from 'googlesitekit-data';
import { isFeatureEnabled } from '@/js/features';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
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
import { type ConfiguredCTA, type ReaderRevenueManagerSettings } from './types';

export type CreateCTAParams = {
	data: CreateCTAData;
};

interface CTAsState {
	ctas: CTA[] | undefined;
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
 * @since n.e.x.t Stores the type, state and display name of each CTA.
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

const fetchGetCTAsStore = createFetchStore( {
	baseName: 'getCTAs',
	controlCallback: () =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'ctas',
			{},
			{ useCache: false }
		),
	reducerCallback: createReducer( ( state: CTAsState, ctas: CTA[] ) => {
		state.ctas = ctas;

		// Update settings states with configured CTAs.
		if ( isFeatureEnabled( 'rrmExpressSetup' ) ) {
			syncConfiguredCTAs( state, ctas );
		}
	} ),
} );

const fetchCreateCTAStore = createFetchStore( {
	baseName: 'createCTA',
	controlCallback: ( { data }: CreateCTAParams ) =>
		set( 'modules', MODULE_SLUG_READER_REVENUE_MANAGER, 'create-cta', {
			data,
		} ),
	reducerCallback: createReducer( ( state: CTAsState, cta: CTA ) => {
		// Only extend an already loaded list, otherwise the resolver would
		// treat the single created CTA as the complete set.
		if ( state.ctas === undefined ) {
			return;
		}

		state.ctas.push( cta );
	} ),
	argsToParams: ( { data }: Partial< CreateCTAParams > = {} ) => ( { data } ),
	validateParams: validateCreateCTAParams,
	isAction: true,
} );

const baseInitialState: CTAsState = {
	ctas: undefined,
};

const baseActions = {
	/**
	 * Creates a CTA for the connected publication.
	 *
	 * @since 1.187.0
	 * @since 1.189.0 Added support for the CTA `state` property. Defaults to `ACTIVE`.
	 * @since n.e.x.t Acts on the connected publication; no longer accepts publication identifiers.
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
			// @ts-expect-error createFetchStore is not properly typed yet.
			return yield fetchCreateCTAStore.actions.fetchCreateCTA( {
				data: {
					...data,
					state: data.state ?? CTA_STATES.ACTIVE,
				},
			} );
		}
	),

	/**
	 * Resets the CTAs in the store, so they are requested again.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The dispatched action results.
	 */
	*resetCTAs(): Generator< unknown, unknown, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		yield {
			type: 'RESET_CTAS',
		};

		yield errorStoreActions.clearSelectorErrors( 'getCTAs' );

		return registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.invalidateResolutionForStoreSelector( 'getCTAs' );
	},
};

const baseReducer = createReducer(
	( state: CTAsState, { type }: { type: string } ) => {
		switch ( type ) {
			case 'RESET_CTAS':
				state.ctas = baseInitialState.ctas;
				break;

			default:
				break;
		}
	}
);

const baseResolvers = {
	*getCTAs(): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as Registry;

		// The saved publication ID decides whether to fetch, so wait for the
		// settings before reading it.
		yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getSettings()
		);

		const ctas = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getCTAs();

		if ( ctas !== undefined ) {
			return;
		}

		// No connected publication to list CTAs for; skip the fetch rather
		// than looping on `undefined`.
		if (
			! registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSavedPublicationID()
		) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetCTAsStore.actions.fetchGetCTAs();
	},
};

const baseSelectors = {
	/**
	 * Gets the CTAs of the connected publication.
	 *
	 * @since 1.187.0
	 * @since n.e.x.t Returns the connected publication's CTAs; no longer accepts publication identifiers.
	 *
	 * @param  state Data store's state.
	 * @return {(Array.<Object>|undefined)} The CTAs; `undefined` if not loaded yet.
	 */
	getCTAs( state: CTAsState ): CTA[] | undefined {
		return state.ctas;
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
	reducer: baseReducer,
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
