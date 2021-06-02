/**
 * `modules/idea-hub` data store: published-post-ideas.
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

const fetchGetPublishedPostIdeasStore = createFetchStore( {
	baseName: 'getPublishedPostIdeas',
	controlCallback: () => {
		return API.get( 'modules', 'idea-hub', 'published-post-ideas' );
	},
	reducerCallback: ( state, publishedPostIdeas ) => {
		return {
			...state,
			publishedPostIdeas,
		};
	},
} );

const baseInitialState = {
	publishedPostIdeas: undefined,
};

const baseResolvers = {
	*getPublishedPostIdeas( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const publishedPostIdeas = registry.select( STORE_NAME ).getPublishedPostIdeas( options );

		// If there are already published ideas in state, don't make an API request.
		if ( publishedPostIdeas === undefined ) {
			yield fetchGetPublishedPostIdeasStore.actions.fetchGetPublishedPostIdeas();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets Published Post Ideas from the Idea Hub.
	 *
	 * @since 1.34.0
	 *
	 * @param {Object} state            Data store's state.
	 * @param {Object} options          Options for getting published post ideas.
	 * @param {number} [options.offset] Optional. From which array index to get ideas.
	 * @param {number} [options.length] Optional. Amount of published post ideas to return.
	 * @return {(Array.<Object>|undefined)} A list of idea hub ideas; `undefined` if not loaded.
	 */
	getPublishedPostIdeas( state, options = {} ) {
		const { publishedPostIdeas } = state;

		if ( publishedPostIdeas === undefined ) {
			return undefined;
		}

		const offset = options?.offset || 0;
		const length = options.length ? offset + options.length : publishedPostIdeas.length;
		return ( 'offset' in options || 'length' in options ) ? publishedPostIdeas.slice( offset, length ) : publishedPostIdeas;
	},
};

const store = Data.combineStores(
	fetchGetPublishedPostIdeasStore,
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
