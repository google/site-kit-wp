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
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import {
	combineStores,
	createValidatedAction,
} from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

const { setErrorForAction, clearActionError } = errorStoreActions;

type CTA = Record< string, unknown >;

type NewsletterConfig = Record< string, unknown >;

interface PublicationParams {
	organizationID: string;
	publicationID: string;
}

interface CreateCTAParams extends PublicationParams {
	newsletterConfig: NewsletterConfig;
	displayName?: string;
}

interface CTAsState {
	ctas: Record< string, CTA[] | undefined >;
}

/**
 * Validates the organization and publication identifiers.
 *
 * @since n.e.x.t
 *
 * @param  params Parameters to validate.
 * @return {void}
 */
function validatePublicationParams( params: unknown ): void {
	invariant( isPlainObject( params ), 'params should be an object.' );

	const { organizationID, publicationID } = params as Record<
		string,
		unknown
	>;

	invariant(
		typeof organizationID === 'string' && organizationID.length > 0,
		'organizationID is required and must be a string.'
	);

	invariant(
		typeof publicationID === 'string' && publicationID.length > 0,
		'publicationID is required and must be a string.'
	);
}

/**
 * Validates the CTA creation parameters.
 *
 * @since n.e.x.t
 *
 * @param  params Parameters to validate.
 * @return {void}
 */
function validateCreateCTAParams( params: unknown ): void {
	validatePublicationParams( params );

	const { newsletterConfig } = params as Record< string, unknown >;

	invariant(
		isPlainObject( newsletterConfig ),
		'newsletterConfig is required and must be an object.'
	);
}

const fetchGetCTAsStore = createFetchStore( {
	baseName: 'getCTAs',
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
		}
	),
	argsToParams: ( {
		organizationID,
		publicationID,
	}: PublicationParams ) => ( {
		organizationID,
		publicationID,
	} ),
	validateParams: validatePublicationParams,
} );

const fetchCreateCTAStore = createFetchStore( {
	baseName: 'createCTA',
	controlCallback: ( {
		organizationID,
		publicationID,
		newsletterConfig,
		displayName,
	}: CreateCTAParams ) =>
		set( 'modules', MODULE_SLUG_READER_REVENUE_MANAGER, 'create-cta', {
			organizationID,
			publicationID,
			newsletterConfig,
			displayName,
		} ),
	reducerCallback: createReducer( () => {} ),
	argsToParams: ( {
		organizationID,
		publicationID,
		newsletterConfig,
		displayName,
	}: CreateCTAParams ) => ( {
		organizationID,
		publicationID,
		newsletterConfig,
		displayName,
	} ),
	validateParams: validateCreateCTAParams,
	isAction: true,
} );

const baseInitialState: CTAsState = {
	ctas: {},
};

const baseActions = {
	/**
	 * Creates a newsletter sign-up CTA for the given publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param  params                  Parameters.
	 * @param  params.organizationID   Organization ID.
	 * @param  params.publicationID    Publication ID.
	 * @param  params.newsletterConfig Newsletter sign-up configuration.
	 * @param  params.displayName      Optional internal display name.
	 * @return {Object} Object with `response` and `error`.
	 */
	createCTA: createValidatedAction(
		validateCreateCTAParams,
		function* ( params: CreateCTAParams ) {
			yield clearActionError( 'createCTA', [] );

			const createResult =
				// @ts-expect-error createFetchStore is not properly typed yet.
				yield fetchCreateCTAStore.actions.fetchCreateCTA( params );

			const { response, error } = createResult;

			if ( error ) {
				yield setErrorForAction( error, 'createCTA', [] );
			}

			return { response, error };
		}
	),
};

const baseResolvers = {
	*getCTAs( params: PublicationParams ): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		if (
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getCTAs( params ) === undefined
		) {
			// @ts-expect-error createFetchStore is not properly typed yet.
			yield fetchGetCTAsStore.actions.fetchGetCTAs( params );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the configured CTAs for the given publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param  state                Data store's state.
	 * @param  params               Parameters, including the `organizationID` and `publicationID`.
	 * @param  params.publicationID Publication ID.
	 * @return {(Array.<Object>|undefined)} The configured CTAs; `undefined` if not loaded.
	 */
	getCTAs(
		state: CTAsState,
		{ publicationID }: PublicationParams
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
