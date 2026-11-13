/**
 * `modules/reader-revenue-manager` data store: survey question catalog.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	Select,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { combineStores } from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import { type SurveyQuestion } from './types';

/**
 * `GET:survey-question-catalog` response. The publication is named by the
 * response because the questions themselves do not name it.
 */
type GetSurveyQuestionCatalogResponse = {
	publicationID: string;
	questions: SurveyQuestion[];
};

interface SurveyQuestionCatalogState {
	surveyQuestionCatalog: Record< string, SurveyQuestion[] >;
}

type Registry = WPDataRegistry & {
	resolveSelect: WPDataRegistry[ 'select' ];
};

const fetchGetSurveyQuestionCatalogStore = createFetchStore( {
	baseName: 'getSurveyQuestionCatalog',
	controlCallback: () =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'survey-question-catalog',
			{},
			{ useCache: false }
		),
	reducerCallback: createReducer(
		(
			state: SurveyQuestionCatalogState,
			{ publicationID, questions }: GetSurveyQuestionCatalogResponse
		) => {
			state.surveyQuestionCatalog[ publicationID ] = questions;
		}
	),
} );

const baseInitialState: SurveyQuestionCatalogState = {
	surveyQuestionCatalog: {},
};

const baseActions = {
	/**
	 * Invalidates the survey question catalog resolution, so it is requested
	 * again.
	 *
	 * The stored catalogs are kept, as each publication's catalog is stored
	 * under its own publication ID and cannot be mistaken for another's.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The dispatched action results.
	 */
	*resetSurveyQuestionCatalog(): Generator< unknown, unknown, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		yield errorStoreActions.clearSelectorErrors(
			'getSurveyQuestionCatalog'
		);

		return registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.invalidateResolutionForStoreSelector( 'getSurveyQuestionCatalog' );
	},
};

const baseResolvers = {
	*getSurveyQuestionCatalog(): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as Registry;

		// The saved publication ID decides whether to fetch, so wait for the
		// settings before reading it.
		yield commonActions.await(
			registry
				.resolveSelect( MODULES_READER_REVENUE_MANAGER )
				.getSettings()
		);

		const publicationID = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getSavedPublicationID();

		// No connected publication to get the catalog for.
		if ( ! publicationID ) {
			return;
		}

		if (
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getSurveyQuestionCatalog() !== undefined
		) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetSurveyQuestionCatalogStore.actions.fetchGetSurveyQuestionCatalog();
	},
};

const baseSelectors = {
	/**
	 * Gets the survey question catalog of the connected publication.
	 *
	 * @since n.e.x.t
	 *
	 * @param  state Data store's state.
	 * @return {(Array.<Object>|undefined)} The catalog questions; `undefined` if not loaded yet.
	 */
	getSurveyQuestionCatalog: createRegistrySelector(
		( select: Select ) =>
			(
				state: SurveyQuestionCatalogState
			): SurveyQuestion[] | undefined => {
				const savedPublicationID = select(
					MODULES_READER_REVENUE_MANAGER
				).getSavedPublicationID();

				if ( ! savedPublicationID ) {
					return undefined;
				}

				// A publication that has been picked but not saved yet has no
				// catalog of its own here; the stored one belongs to the
				// publication the server still answers for.
				if (
					select(
						MODULES_READER_REVENUE_MANAGER
					).getPublicationID() !== savedPublicationID
				) {
					return undefined;
				}

				return state.surveyQuestionCatalog[ savedPublicationID ];
			}
	),
};

interface Store {
	initialState: SurveyQuestionCatalogState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores( fetchGetSurveyQuestionCatalogStore, {
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
