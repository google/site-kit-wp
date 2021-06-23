/**
 * `modules/idea-hub` data store: idea-state.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
const { receiveError, clearError } = errorStoreActions;

const fetchPostUpdateIdeaStateStore = createFetchStore( {
	baseName: 'updateIdeaState',
	controlCallback: ( { name, saved, dismissed } ) => {
		const params = { name };

		if ( saved !== undefined ) {
			params.saved = saved;
		} else {
			params.dismissed = dismissed;
		}

		return API.set( 'modules', 'idea-hub', 'update-idea-state', params );
	},
	argsToParams( { name, saved, dismissed } ) {
		return { name, saved, dismissed };
	},
	validateParams( { name, saved, dismissed } = {} ) {
		invariant( typeof name === 'string' && name.length > 0, 'name must be a non empty string' );
		invariant( saved !== undefined || dismissed !== undefined, 'either saved or dimissed property must be set' );
	},
} );

const baseInitialState = {};

const baseActions = {
	/**
	 * Updates a given Idea's state.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object}  ideaState           Idea Hub Idea state.
	 * @param {string}  ideaState.name      Idea Hub Idea name.
	 * @param {boolean} ideaState.saved     Whether the Idea is saved [optional].
	 * @param {boolean} ideaState.dismissed Whether the Idea is dismissed [optional].
	 * @return {Object} Object with `response` and `error`.
	 */
	*updateIdeaState( ideaState ) {
		const response = yield fetchPostUpdateIdeaStateStore.actions.fetchUpdateIdeaState( ideaState );

		return response;
	},
	/**
	 * Saves an Idea.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} ideaName Idea Hub Idea name.
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveIdea( ideaName ) {
		invariant( typeof ideaName === 'string', 'ideaName must be a string.' );

		const registry = yield Data.commonActions.getRegistry();

		yield clearError( 'saveIdea', [] );

		const { response, error } = yield registry.dispatch( STORE_NAME ).updateIdeaState( {
			name: ideaName,
			saved: true,
		} );

		if ( error ) {
			yield receiveError( error, 'saveIdea', [] );
		}

		return { response, error };
	},
	/**
	 * Unsaves an Idea.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} ideaName Idea Hub Idea name.
	 * @return {Object} Object with `response` and `error`.
	 */
	*unsaveIdea( ideaName ) {
		invariant( typeof ideaName === 'string', 'ideaName must be a string.' );

		const registry = yield Data.commonActions.getRegistry();

		yield clearError( 'unsaveIdea', [] );

		const { response, error } = yield registry.dispatch( STORE_NAME ).updateIdeaState( {
			name: ideaName,
			saved: false,
		} );

		if ( error ) {
			yield receiveError( error, 'unsaveIdea', [] );
		}

		return { response, error };
	},
	/**
	 * Dismisses an Idea.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} ideaName Idea Hub Idea name.
	 * @return {Object} Object with `response` and `error`.
	 */
	*dismissIdea( ideaName ) {
		invariant( typeof ideaName === 'string', 'ideaName must be a string.' );

		const registry = yield Data.commonActions.getRegistry();

		yield clearError( 'dismissIdea', [] );

		const { response, error } = yield registry.dispatch( STORE_NAME ).updateIdeaState( {
			name: ideaName,
			dismissed: true,
		} );

		if ( error ) {
			yield receiveError( error, 'dismissIdea', [] );
		}

		return { response, error };
	},
};

const store = Data.combineStores(
	fetchPostUpdateIdeaStateStore,
	{
		actions: baseActions,
		initialState: baseInitialState,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
