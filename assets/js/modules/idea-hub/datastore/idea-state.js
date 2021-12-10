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
import omit from 'lodash/omit';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import { actions as moduleDataActions } from './module-data';
const { receiveError, clearError } = errorStoreActions;

const SET_ACTIVITY = 'SET_ACTIVITY';
const REMOVE_ACTIVITY = 'REMOVE_ACTIVITY';
const REMOVE_ACTIVITIES = 'REMOVE_ACTIVITIES';
const MOVE_IDEA_FROM_NEW_IDEAS_TO_SAVED_IDEAS =
	'MOVE_IDEA_FROM_NEW_IDEAS_TO_SAVED_IDEAS';
const MOVE_IDEA_FROM_SAVED_IDEAS_TO_NEW_IDEAS =
	'MOVE_IDEA_FROM_SAVED_IDEAS_TO_NEW_IDEAS';
const REMOVE_IDEA_FROM_NEW_IDEAS = 'REMOVE_IDEA_FROM_NEW_IDEAS';

const fetchPostUpdateIdeaStateStore = createFetchStore( {
	baseName: 'updateIdeaState',
	controlCallback: ( { name, saved, dismissed } ) => {
		const params = { name };

		if ( saved !== undefined ) {
			params.saved = saved;
		} else {
			params.dismissed = dismissed;
		}

		return API.set(
			'modules',
			'idea-hub',
			'update-idea-state',
			params
		).then( async ( result ) => {
			await API.invalidateCache(
				'modules',
				'idea-hub',
				'new-ideas'
			).catch( () => {} );
			await API.invalidateCache(
				'modules',
				'idea-hub',
				'saved-ideas'
			).catch( () => {} );

			return result;
		} );
	},
	argsToParams( { name, saved, dismissed } ) {
		return { name, saved, dismissed };
	},
	validateParams( { name, saved, dismissed } = {} ) {
		invariant(
			typeof name === 'string' && name.length > 0,
			'name must be a non empty string'
		);
		invariant(
			saved !== undefined || dismissed !== undefined,
			'either saved or dismissed property must be set'
		);
	},
} );

const baseInitialState = {
	activities: {},
};

const baseActions = {
	/**
	 * Updates a given Idea's state.
	 *
	 * @since 1.36.0
	 *
	 * @param {Object}  ideaState           Idea Hub Idea state.
	 * @param {string}  ideaState.name      Idea Hub Idea name.
	 * @param {boolean} ideaState.saved     Whether the Idea is saved [optional].
	 * @param {boolean} ideaState.dismissed Whether the Idea is dismissed [optional].
	 * @return {Object} Object with `response` and `error`.
	 */
	*updateIdeaState( ideaState ) {
		const {
			response,
			error,
		} = yield fetchPostUpdateIdeaStateStore.actions.fetchUpdateIdeaState(
			ideaState
		);

		if ( ! error ) {
			yield moduleDataActions.incrementInteractions();
		}

		return { response, error };
	},
	/**
	 * Saves an Idea.
	 *
	 * @since 1.36.0
	 *
	 * @param {string} ideaName Idea Hub Idea name.
	 * @return {Object} Object with `response` and `error`.
	 */
	*saveIdea( ideaName ) {
		invariant( typeof ideaName === 'string', 'ideaName must be a string.' );

		yield clearError( 'saveIdea', [ ideaName ] );

		const { response, error } = yield baseActions.updateIdeaState( {
			name: ideaName,
			saved: true,
		} );

		if ( error ) {
			yield receiveError( error, 'saveIdea', [ ideaName ] );
		}

		return { response, error };
	},
	/**
	 * Unsaves an Idea.
	 *
	 * @since 1.36.0
	 *
	 * @param {string} ideaName Idea Hub Idea name.
	 * @return {Object} Object with `response` and `error`.
	 */
	*unsaveIdea( ideaName ) {
		invariant( typeof ideaName === 'string', 'ideaName must be a string.' );

		yield clearError( 'unsaveIdea', [ ideaName ] );

		const { response, error } = yield baseActions.updateIdeaState( {
			name: ideaName,
			saved: false,
		} );

		if ( error ) {
			yield receiveError( error, 'unsaveIdea', [ ideaName ] );
		}

		return { response, error };
	},
	/**
	 * Dismisses an Idea.
	 *
	 * @since 1.36.0
	 *
	 * @param {string} ideaName Idea Hub Idea name.
	 * @return {Object} Object with `response` and `error`.
	 */
	*dismissIdea( ideaName ) {
		invariant( typeof ideaName === 'string', 'ideaName must be a string.' );

		yield clearError( 'dismissIdea', [ ideaName ] );

		const { response, error } = yield baseActions.updateIdeaState( {
			name: ideaName,
			dismissed: true,
		} );

		if ( error ) {
			yield receiveError( error, 'dismissIdea', [ ideaName ] );
		}

		return { response, error };
	},

	/**
	 * Sets an actvity.
	 *
	 * @since 1.37.0
	 *
	 * @param {string} key   The idea name.
	 * @param {string} value Store the current activity of the idea, i.e whether a draft is being created or has been created.
	 * @return {Object} Redux-style action.
	 */
	setActivity( key, value ) {
		invariant(
			typeof key === 'string' && key.length > 0,
			'key is required.'
		);

		return {
			payload: { key, value },
			type: SET_ACTIVITY,
		};
	},

	/**
	 * Removes an actvity.
	 *
	 * @since 1.37.0
	 *
	 * @param {string} key The idea name.
	 * @return {Object} Redux-style action.
	 */
	removeActivity( key ) {
		invariant(
			typeof key === 'string' && key.length > 0,
			'key is required.'
		);

		return {
			payload: { key },
			type: REMOVE_ACTIVITY,
		};
	},
	/**
	 * Removes all activities with a given activity type.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} activityType The activity type.
	 * @return {Object} Redux-style action.
	 */
	removeActivities( activityType ) {
		invariant(
			typeof activityType === 'string' && activityType.length > 0,
			'activityType is required.'
		);

		return {
			payload: { activityType },
			type: REMOVE_ACTIVITIES,
		};
	},

	/**
	 * Moves an idea from the list of newIdeas state variable to savedIdeas state variable.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} name Idea name.
	 * @return {Object} Redux-style action.
	 */
	moveIdeaFromNewIdeasToSavedIdeas( name ) {
		invariant(
			typeof name === 'string' && name.length > 0,
			'name is required.'
		);

		return {
			payload: { name },
			type: MOVE_IDEA_FROM_NEW_IDEAS_TO_SAVED_IDEAS,
		};
	},

	/**
	 * Moves an idea from the list of savedIdeas state variable to newIdeas state variable.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} name Idea name.
	 * @return {Object} Redux-style action.
	 */
	moveIdeaFromSavedIdeasToNewIdeas( name ) {
		invariant(
			typeof name === 'string' && name.length > 0,
			'name is required.'
		);

		return {
			payload: { name },
			type: MOVE_IDEA_FROM_SAVED_IDEAS_TO_NEW_IDEAS,
		};
	},

	/**
	 * Removes an idea from the list of newIdeas state variable.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} name Idea name.
	 * @return {Object} Redux-style action.
	 */
	removeIdeaFromNewIdeas( name ) {
		invariant(
			typeof name === 'string' && name.length > 0,
			'name is required.'
		);

		return {
			payload: { name },
			type: REMOVE_IDEA_FROM_NEW_IDEAS,
		};
	},
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_ACTIVITY: {
			const { key, value } = payload;

			return {
				...state,
				activities: {
					...state.activities,
					[ key ]: value,
				},
			};
		}

		case REMOVE_ACTIVITY: {
			const { key } = payload;

			return {
				...state,
				activities: omit( state.activities, [ key ] ),
			};
		}

		case REMOVE_ACTIVITIES: {
			const { activityType } = payload;
			const activities = Object.fromEntries(
				Object.entries( state.activities ).filter(
					( [ key, value ] ) => value !== activityType // eslint-disable-line no-unused-vars
				)
			);

			return {
				...state,
				activities,
			};
		}

		case MOVE_IDEA_FROM_NEW_IDEAS_TO_SAVED_IDEAS: {
			const { name } = payload;

			const ideaDetails = state.newIdeas.find(
				( idea ) => idea.name === name
			);
			if ( ! ideaDetails ) {
				return state;
			}

			return {
				...state,
				newIdeas: state.newIdeas.filter(
					( idea ) => idea.name !== name
				),
				savedIdeas: [ ...state.savedIdeas, ideaDetails ],
			};
		}

		case MOVE_IDEA_FROM_SAVED_IDEAS_TO_NEW_IDEAS: {
			const { name } = payload;

			const ideaDetails = state.savedIdeas.find(
				( idea ) => idea.name === name
			);
			if ( ! ideaDetails ) {
				return state;
			}

			return {
				...state,
				newIdeas: [ ...state.newIdeas, ideaDetails ],
				savedIdeas: state.savedIdeas.filter(
					( idea ) => idea.name !== name
				),
			};
		}

		case REMOVE_IDEA_FROM_NEW_IDEAS: {
			const { name } = payload;

			return {
				...state,
				newIdeas: state.newIdeas.filter(
					( idea ) => idea.name !== name
				),
			};
		}

		default: {
			return state;
		}
	}
};

export const baseSelectors = {
	/**
	 * Gets the existing activity by key.
	 *
	 * @since 1.37.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} key   Get data stored in this key.
	 * @return {*} Value stored in state by key. Returns `undefined` if key isn't found.
	 */
	getActivity( state, key ) {
		return state.activities[ key ];
	},
};

const store = Data.combineStores( fetchPostUpdateIdeaStateStore, {
	actions: baseActions,
	initialState: baseInitialState,
	reducer: baseReducer,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
