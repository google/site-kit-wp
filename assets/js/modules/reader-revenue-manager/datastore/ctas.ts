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
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import {
	combineStores,
	createValidatedAction,
} from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import {
	type CTA,
	type CreateCTAData,
	getCTATypeHandler,
	isCTAType,
} from './cta-types';
import {
	type PublicationParams,
	getSelectedPublicationID,
	resolvePublicationParams,
	validateOptionalPublicationParams,
	validatePublicationParams,
} from './publications';
import { type ReaderRevenueManagerSettings } from './types';

type GetCTAsParams = Partial< PublicationParams >;

type CreateCTAParams = Partial< PublicationParams > & {
	data: CreateCTAData;
};
interface CTAsState {
	ctas: Record< string, CTA[] | undefined >;
	settings?: ReaderRevenueManagerSettings;
}

type Registry = WPDataRegistry & {
	resolveSelect: WPDataRegistry[ 'select' ];
};

/**
 * Validates the CTA creation parameters.
 *
 * @since n.e.x.t
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

	const { type, config, displayName } = data as Record< string, unknown >;

	invariant( isCTAType( type ), 'data.type is not supported.' );

	getCTATypeHandler( type ).validateConfig( config );

	invariant(
		displayName === undefined || typeof displayName === 'string',
		'data.displayName must be a string.'
	);
}

const fetchGetCTAsStore = createFetchStore( {
	baseName: 'getCTAs',
	controlCallback: ( params: PublicationParams ) =>
		get( 'modules', MODULE_SLUG_READER_REVENUE_MANAGER, 'ctas', params, {
			useCache: false,
		} ),
	reducerCallback: createReducer(
		( state: CTAsState, ctas: CTA[], params: PublicationParams ) => {
			state.ctas[ params.publicationID ] = ctas;
		}
	),
	argsToParams: ( params: Partial< PublicationParams > = {} ) => params,
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
			const { publicationID } = params;

			// Only extend an already loaded list, otherwise the resolver would
			// treat the single created CTA as the complete set.
			if (
				! publicationID ||
				state.ctas[ publicationID ] === undefined
			) {
				return;
			}

			state.ctas[ publicationID ].push( cta );
		}
	),
	argsToParams: ( params: CreateCTAParams ) => params,
	validateParams: ( params: unknown ) => {
		validateCreateCTAParams( params );
		validatePublicationParams( params as Partial< PublicationParams > );
	},
	isAction: true,
} );

const baseInitialState: CTAsState = {
	ctas: {},
};

const baseActions = {
	/**
	 * Creates a CTA for the given publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param  params                  Parameters.
	 * @param  params.organizationID   Optional. Organization ID. Defaults to the saved module setting.
	 * @param  params.publicationID    Optional. Publication ID. Defaults to the saved module setting.
	 * @param  params.data             CTA data.
	 * @param  params.data.type        CTA type.
	 * @param  params.data.config      Type-specific CTA configuration.
	 * @param  params.data.displayName Optional. Internal display name.
	 * @return {Object} Object with `response` and `error`.
	 */
	createCTA: createValidatedAction(
		validateCreateCTAParams,
		function* (
			params: CreateCTAParams
		): Generator< unknown, unknown, unknown > {
			const registry = ( yield commonActions.getRegistry() ) as Registry;

			const resolved = ( yield commonActions.await(
				resolvePublicationParams( registry, params )
			) ) as PublicationParams | undefined;

			if ( ! resolved ) {
				return {};
			}

			// @ts-expect-error createFetchStore is not properly typed yet.
			return yield fetchCreateCTAStore.actions.fetchCreateCTA( {
				...params,
				...resolved,
			} );
		}
	),
};

const baseResolvers = {
	*getCTAs(
		params: GetCTAsParams = {}
	): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as Registry;

		const resolved = ( yield commonActions.await(
			resolvePublicationParams( registry, params )
		) ) as PublicationParams | undefined;

		if ( ! resolved ) {
			return;
		}

		const ctas = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getCTAs( resolved );

		if ( ctas !== undefined ) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetCTAsStore.actions.fetchGetCTAs( resolved );
	},
};

const baseSelectors = {
	/**
	 * Gets the CTAs for the publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param  state  Data store's state.
	 * @param  params Optional parameters.
	 * @return {(Array.<Object>|undefined)} The CTAs; `undefined` if not loaded yet.
	 */
	getCTAs( state: CTAsState, params: GetCTAsParams = {} ): CTA[] | undefined {
		const selectedPublicationID = getSelectedPublicationID( state, params );

		if ( ! selectedPublicationID ) {
			return undefined;
		}

		return state.ctas[ selectedPublicationID ];
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
