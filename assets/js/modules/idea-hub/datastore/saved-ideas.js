/**
 * `modules/idea-hub` data store: saved-ideas.
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

const fetchGetSavedIdeasStore = createFetchStore( {
	baseName: 'getSavedIdeas',
	controlCallback: ( { timestamp } ) => {
		return API.get( 'modules', 'idea-hub', 'saved-ideas', { timestamp } );
	},
	argsToParams( { timestamp } ) {
		return { timestamp };
	},
	reducerCallback: ( state, savedIdeas ) => {
		state.savedIdeas = savedIdeas;
	},
} );

const baseInitialState = {
	savedIdeas: undefined,
};

const baseResolvers = {
	*getSavedIdeas() {
		const registry = yield commonActions.getRegistry();
		const savedIdeas = registry.select( MODULES_IDEA_HUB ).getSavedIdeas();

		// If there are already saved ideas in state, don't make an API request.
		if ( savedIdeas === undefined ) {
			const timestamp = registry
				.select( MODULES_IDEA_HUB )
				.getLastIdeaPostUpdatedAt();

			yield fetchGetSavedIdeasStore.actions.fetchGetSavedIdeas( {
				timestamp,
			} );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets Saved Ideas from the Idea Hub.
	 *
	 * @since 1.33.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getSavedIdeas( state ) {
		return state.savedIdeas;
	},

	/**
	 * Gets a subset of saved ideas from the Idea Hub.
	 *
	 * @since 1.40.0
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Object} options          Options for getting saved ideas.
	 * @param {number} [options.offset] Optional. From which array index to get ideas.
	 * @param {number} [options.length] Optional. Amount of saved ideas to return.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getSavedIdeasSlice: createRegistrySelector(
		( select ) => ( state, options = {} ) => {
			const savedIdeas = select( MODULES_IDEA_HUB ).getSavedIdeas();
			if ( savedIdeas === undefined ) {
				return undefined;
			}

			const offset = options?.offset || 0;
			const length = options.length
				? offset + options.length
				: savedIdeas.length;
			return 'offset' in options || 'length' in options
				? savedIdeas.slice( offset, length )
				: savedIdeas;
		}
	),
};

const store = combineStores( fetchGetSavedIdeasStore, {
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
