/**
 * `core/user` data store: Tracking info.
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
import { commonActions, combineStores } from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';
import { actions as errorStoreActions } from '../../data/create-error-store';
const { receiveError, clearError } = errorStoreActions;

const fetchStoreReducerCallback = ( state, tracking ) => ( {
	...state,
	tracking,
} );

const fetchGetTrackingStore = createFetchStore( {
	baseName: 'getTracking',
	controlCallback: () => {
		return API.get( 'core', 'user', 'tracking' );
	},
	reducerCallback: fetchStoreReducerCallback,
} );

const fetchSaveTrackingStore = createFetchStore( {
	baseName: 'setTracking',
	controlCallback: ( enabled ) =>
		API.set( 'core', 'user', 'tracking', { enabled: !! enabled } ),
	reducerCallback: fetchStoreReducerCallback,
	argsToParams: ( enabled ) => enabled,
} );

const baseInitialState = {
	tracking: undefined,
	isSavingTrackingEnabled: false,
};

// Actions
const SET_TRACKING_ENABLED_SAVING_ACTION = 'SET_TRACKING_ENABLED_SAVING_ACTION';

const baseActions = {
	/**
	 * Sets user tracking settings.
	 *
	 * @since 1.28.0
	 *
	 * @param {boolean} enabled Tracking status.
	 * @return {Object} Object with `response` and `error`.
	 */
	*setTrackingEnabled( enabled ) {
		yield clearError( 'setTrackingEnabled', [ enabled ] );

		yield {
			type: SET_TRACKING_ENABLED_SAVING_ACTION,
			payload: { isSaving: true },
		};

		const { response, error } =
			yield fetchSaveTrackingStore.actions.fetchSetTracking( enabled );
		if ( error ) {
			yield receiveError( error, 'setTrackingEnabled', [ enabled ] );
		}

		yield {
			type: SET_TRACKING_ENABLED_SAVING_ACTION,
			payload: { isSaving: false },
		};

		return { response, error };
	},
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_TRACKING_ENABLED_SAVING_ACTION: {
			return {
				...state,
				isSavingTrackingEnabled: payload.isSaving,
			};
		}
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*isTrackingEnabled() {
		const { select } = yield commonActions.getRegistry();
		if ( select( CORE_USER ).isTrackingEnabled() === undefined ) {
			yield fetchGetTrackingStore.actions.fetchGetTracking();
		}
	},
};

const baseSelectors = {
	/**
	 * Determines whether the user tracking settings are being saved or not.
	 *
	 * @since 1.28.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the user tracking settings are being saved, otherwise FALSE.
	 */
	isSavingTrackingEnabled( state ) {
		return !! state?.isSavingTrackingEnabled;
	},

	/**
	 * Determines whether the user tracking is enabled or not.
	 *
	 * @since 1.28.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} TRUE if user tracking enabled, otherwise FALSE.
	 */
	isTrackingEnabled( state ) {
		const { tracking } = state;
		return tracking?.enabled;
	},
};

const store = combineStores( fetchGetTrackingStore, fetchSaveTrackingStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
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
