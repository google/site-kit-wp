/**
 * `modules/reader-revenue-manager` data store: Terms of Service.
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

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	combineStores,
	commonActions,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';

interface TermsOfServiceParams {
	tosURL: string;
}

interface TermsOfServiceState {
	termsOfService: Record< string, string >;
}

const fetchGetTermsOfServiceStore = createFetchStore( {
	baseName: 'getTermsOfService',
	controlCallback: ( { tosURL }: TermsOfServiceParams ) =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'terms-of-service',
			{ tosURL },
			{ useCache: false }
		),
	reducerCallback: createReducer(
		(
			state: TermsOfServiceState,
			termsOfService: string,
			{ tosURL }: TermsOfServiceParams
		) => {
			state.termsOfService = state.termsOfService || {};
			state.termsOfService[ tosURL ] = termsOfService;
		}
	),
	argsToParams: ( { tosURL }: Partial< TermsOfServiceParams > = {} ) => ( {
		tosURL,
	} ),
	validateParams: ( { tosURL }: Partial< TermsOfServiceParams > = {} ) => {
		invariant(
			typeof tosURL === 'string' && tosURL.length > 0,
			'tosURL is required and must be a string.'
		);
	},
} );

const baseInitialState: TermsOfServiceState = {
	termsOfService: {},
};

const baseResolvers = {
	*getTermsOfService( {
		tosURL,
	}: Partial< TermsOfServiceParams > = {} ): Generator<
		unknown,
		void,
		unknown
	> {
		if ( ! tosURL ) {
			return;
		}

		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;
		const termsOfService = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getTermsOfService( { tosURL } );

		if ( termsOfService === undefined ) {
			// @ts-expect-error createFetchStore is not properly typed yet.
			yield fetchGetTermsOfServiceStore.actions.fetchGetTermsOfService( {
				tosURL,
			} );
		}
	},
};

const baseSelectors = {
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
	getTermsOfService(
		state: TermsOfServiceState,
		{ tosURL }: Partial< TermsOfServiceParams > = {}
	) {
		if ( ! tosURL ) {
			return undefined;
		}

		return state.termsOfService?.[ tosURL ];
	},
};

interface Store {
	initialState: TermsOfServiceState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores( fetchGetTermsOfServiceStore, {
	initialState: baseInitialState,
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
