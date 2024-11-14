/**
 * `modules/sign-in-with-google` data store: get "Anyone can register" value from WordPress.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import {
	commonActions,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';
import { get } from '../../../googlesitekit/api';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const SET_ANYONE_CAN_REGISTER = 'SET_ANYONE_CAN_REGISTER';

const fetchAnyoneCanRegisterStore = createFetchStore( {
	baseName: 'anyoneCanRegister',
	controlCallback: () => {
		return get(
			'modules',
			'sign-in-with-google',
			'anyone-can-register',
			undefined,
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, { value } ) => {
		return {
			...state,
			anyoneCanRegister: value,
		};
	},
} );

const baseInitialState = { anyoneCanRegister: undefined };

const baseActions = {
	/**
	 * Sets the state of open user registration for this WordPress site.
	 *
	 * @since n.e.x.t
	 *
	 * @param {boolean} enabled "Anyone can register" status.
	 * @return {Object} Redux-style action.
	 */
	setAnyoneCanRegister( enabled ) {
		return {
			type: SET_ANYONE_CAN_REGISTER,
			payload: { enabled },
		};
	},
};

const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_ANYONE_CAN_REGISTER:
			state.anyoneCanRegister = payload.enabled;
			break;

		default:
			break;
	}
} );

export const baseResolvers = {
	*getAnyoneCanRegister() {
		const registry = yield commonActions.getRegistry();

		const anyoneCanRegister = registry
			.select( MODULES_SIGN_IN_WITH_GOOGLE )
			.getAnyoneCanRegister();

		if ( anyoneCanRegister === undefined ) {
			yield fetchAnyoneCanRegisterStore.actions.fetchAnyoneCanRegister();
		}
	},
};

const baseSelectors = {
	/**
	 * Checks if user registrations are open on this WordPress site.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean|undefined} `true` if registrations are open; `false` if not. Returns `undefined` if not yet loaded.
	 */
	getAnyoneCanRegister: ( state ) => {
		return state.anyoneCanRegister;
	},
};

const store = combineStores( fetchAnyoneCanRegisterStore, {
	initialState: baseInitialState,
	actions: baseActions,
	selectors: baseSelectors,
	reducer: baseReducer,
	resolvers: baseResolvers,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
