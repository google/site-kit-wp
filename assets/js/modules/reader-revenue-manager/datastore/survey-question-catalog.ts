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

const baseResolvers = {
	*getPublicationSurveyQuestionCatalog(
		publicationID: string
	): Generator< unknown, void, unknown > {
		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		if (
			registry
				.select( MODULES_READER_REVENUE_MANAGER )
				.getPublicationSurveyQuestionCatalog( publicationID ) !==
			undefined
		) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetSurveyQuestionCatalogStore.actions.fetchGetSurveyQuestionCatalog();
	},
};

const baseSelectors = {
	/**
	 * Gets the survey question catalog stored for a publication.
	 *
	 * The resolution is keyed by the publication ID, so a change of the
	 * connected publication starts a new request without resetting anything.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param  state         Data store's state.
	 * @param  publicationID Publication ID.
	 * @return {(Array.<Object>|undefined)} The catalog questions; `undefined` if not loaded yet.
	 */
	getPublicationSurveyQuestionCatalog(
		state: SurveyQuestionCatalogState,
		publicationID: string
	): SurveyQuestion[] | undefined {
		return state.surveyQuestionCatalog[ publicationID ];
	},

	/**
	 * Gets the survey question catalog of the connected publication.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(Array.<Object>|undefined)} The catalog questions; `undefined` if not loaded yet.
	 */
	getSurveyQuestionCatalog: createRegistrySelector(
		( select: Select ) => (): SurveyQuestion[] | undefined => {
			// Read the settings so they load, as the saved publication ID
			// comes from them.
			if (
				select( MODULES_READER_REVENUE_MANAGER ).getSettings() ===
				undefined
			) {
				return undefined;
			}

			const savedPublicationID = select(
				MODULES_READER_REVENUE_MANAGER
			).getSavedPublicationID();

			if ( ! savedPublicationID ) {
				return undefined;
			}

			// A publication that has been picked but not saved yet has no
			// catalog of its own here; the server still answers for the
			// saved publication.
			if (
				select( MODULES_READER_REVENUE_MANAGER ).getPublicationID() !==
				savedPublicationID
			) {
				return undefined;
			}

			return select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationSurveyQuestionCatalog( savedPublicationID );
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
