/**
 * `modules/idea-hub` data store: draft-post-ideas.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { MODULES_IDEA_HUB } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistrySelector, commonActions, combineStores } = Data;

const fetchGetDraftPostIdeasStore = createFetchStore( {
	baseName: 'getDraftPostIdeas',
	controlCallback: ( { timestamp } ) => {
		return API.get( 'modules', 'idea-hub', 'draft-post-ideas', {
			timestamp,
		} );
	},
	argsToParams( { timestamp } ) {
		return { timestamp };
	},
	reducerCallback: ( state, draftPostIdeas ) => {
		state.draftPostIdeas = draftPostIdeas;
	},
} );

const baseInitialState = {
	draftPostIdeas: undefined,
};

const baseResolvers = {
	*getDraftPostIdeas() {
		const registry = yield commonActions.getRegistry();
		const draftPostIdeas = registry
			.select( MODULES_IDEA_HUB )
			.getDraftPostIdeas();

		// If there are already draft ideas in state, don't make an API request.
		if ( draftPostIdeas === undefined ) {
			const timestamp = registry
				.select( MODULES_IDEA_HUB )
				.getLastIdeaPostUpdatedAt();

			yield fetchGetDraftPostIdeasStore.actions.fetchGetDraftPostIdeas( {
				timestamp,
			} );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets draft post ideas from the Idea Hub.
	 *
	 * @since 1.34.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getDraftPostIdeas( state ) {
		return state.draftPostIdeas;
	},

	/**
	 * Gets a slice of draft post ideas from the Idea Hub.
	 *
	 * @since 1.40.0
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Object} options          Options for getting draft post ideas.
	 * @param {number} [options.offset] Optional. From which array index to get ideas.
	 * @param {number} [options.length] Optional. Amount of draft post ideas to return.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getDraftPostIdeasSlice: createRegistrySelector(
		( select ) => ( state, options = {} ) => {
			const draftPostIdeas = select(
				MODULES_IDEA_HUB
			).getDraftPostIdeas();
			if ( draftPostIdeas === undefined ) {
				return undefined;
			}

			const offset = options?.offset || 0;
			const length = options.length
				? offset + options.length
				: draftPostIdeas.length;
			return 'offset' in options || 'length' in options
				? draftPostIdeas.slice( offset, length )
				: draftPostIdeas;
		}
	),
};

const store = combineStores( fetchGetDraftPostIdeasStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
