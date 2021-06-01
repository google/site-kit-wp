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
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetSavedIdeasStore = createFetchStore( {
	baseName: 'getSavedIdeas',
	controlCallback: () => {
		return API.get( 'modules', 'idea-hub', 'saved-ideas' );
	},
	reducerCallback: ( state, savedIdeas ) => {
		return {
			...state,
			savedIdeas,
		};
	},
} );

const baseInitialState = {
	savedIdeas: undefined,
};

const baseResolvers = {
	*getSavedIdeas( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const savedIdeas = registry.select( STORE_NAME ).getSavedIdeas( options );

		// If there are already saved ideas in state, don't make an API request.
		if ( savedIdeas === undefined ) {
			yield fetchGetSavedIdeasStore.actions.fetchGetSavedIdeas();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets Saved Ideas from the Idea Hub.
	 *
	 * @since 1.33.0
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Object} options          Options for getting saved ideas.
	 * @param {number} [options.offset] Optional. From which array index to get ideas.
	 * @param {number} [options.length] Optional. Amount of saved ideas to return.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getSavedIdeas( state, options = {} ) {
		const { savedIdeas } = state;

		if ( savedIdeas === undefined ) {
			return undefined;
		}

		const offset = options?.offset || 0;
		const length = options.length ? offset + options.length : savedIdeas.length;
		return ( 'offset' in options || 'length' in options ) ? savedIdeas.slice( offset, length ) : savedIdeas;
	},
};

const store = Data.combineStores(
	fetchGetSavedIdeasStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
