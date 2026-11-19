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
import {
	type PublicationParams,
	validatePublicationParams,
} from './publications';
import { type SurveyQuestion } from './types';

interface SurveyQuestionCatalogState {
	surveyQuestionCatalog: Record< string, SurveyQuestion[] | undefined >;
}

const fetchGetPublicationSurveyQuestionCatalogStore = createFetchStore( {
	baseName: 'getPublicationSurveyQuestionCatalog',
	controlCallback: ( { organizationID, publicationID }: PublicationParams ) =>
		get(
			'modules',
			MODULE_SLUG_READER_REVENUE_MANAGER,
			'survey-question-catalog',
			{ organizationID, publicationID },
			{ useCache: false }
		),
	reducerCallback: createReducer(
		(
			state: SurveyQuestionCatalogState,
			questions: SurveyQuestion[],
			{ publicationID }: PublicationParams
		) => {
			state.surveyQuestionCatalog[ publicationID ] = questions;
		}
	),
	argsToParams: (
		organizationID: string,
		publicationID: string
	): PublicationParams => ( { organizationID, publicationID } ),
	validateParams: validatePublicationParams,
} );

const baseInitialState: SurveyQuestionCatalogState = {
	surveyQuestionCatalog: {},
};

const baseResolvers = {
	*getPublicationSurveyQuestionCatalog(
		organizationID: string,
		publicationID: string
	): Generator< unknown, void, unknown > {
		if ( ! organizationID || ! publicationID ) {
			return;
		}

		const registryResult = yield commonActions.getRegistry();
		const registry = registryResult as WPDataRegistry;

		const questions = registry
			.select( MODULES_READER_REVENUE_MANAGER )
			.getPublicationSurveyQuestionCatalog(
				organizationID,
				publicationID
			);

		if ( questions !== undefined ) {
			return;
		}

		// @ts-expect-error createFetchStore is not properly typed yet.
		yield fetchGetPublicationSurveyQuestionCatalogStore.actions.fetchGetPublicationSurveyQuestionCatalog(
			organizationID,
			publicationID
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the survey question catalog of the publication in the module settings.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(Array.<Object>|undefined)} The catalog questions; `undefined` if not loaded yet.
	 */
	getSurveyQuestionCatalog: createRegistrySelector(
		( select: Select ) => (): SurveyQuestion[] | undefined => {
			const params = select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationParams();

			if ( ! params ) {
				return undefined;
			}

			return select(
				MODULES_READER_REVENUE_MANAGER
			).getPublicationSurveyQuestionCatalog(
				params.organizationID,
				params.publicationID
			);
		}
	),

	/**
	 * Gets the survey question catalog of a publication.
	 *
	 * The catalogs are stored under their publication ID, and the resolution
	 * is keyed the same way, so changing the publication requests the new
	 * one's catalog on its own.
	 *
	 * The organization only addresses the request, so the catalogs are not
	 * stored under it.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param  state           Data store's state.
	 * @param  _organizationID Organization ID.
	 * @param  publicationID   Publication ID.
	 * @return {(Array.<Object>|undefined)} The catalog questions; `undefined` if not loaded yet.
	 */
	getPublicationSurveyQuestionCatalog(
		state: SurveyQuestionCatalogState,
		_organizationID: string,
		publicationID: string
	): SurveyQuestion[] | undefined {
		return state.surveyQuestionCatalog[ publicationID ];
	},
};

interface Store {
	initialState: SurveyQuestionCatalogState;
	actions: Record< string, unknown >;
	controls: Record< string, unknown >;
	reducer: Record< string, unknown >;
	resolvers: Record< string, unknown >;
	selectors: Record< string, unknown >;
}

const store = combineStores( fetchGetPublicationSurveyQuestionCatalogStore, {
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
