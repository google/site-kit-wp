/**
 * core/user data store
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import authentication from './authentication';
import disconnect from './disconnect';
import userInfo from './user-info';

import error from './error';
import { STORE_NAME } from './constants';
export { STORE_NAME };

export const INITIAL_STATE = Data.collectState(
	authentication.INITIAL_STATE,
	disconnect.INITIAL_STATE,
	userInfo.INITIAL_STATE,
	error.INITIAL_STATE
);

export const actions = Data.addInitializeAction(
	Data.collectActions(
		Data.commonActions,
		authentication.actions,
		disconnect.actions,
		userInfo.actions,
		error.actions
	)
);

export const controls = Data.collectControls(
	Data.commonControls,
	authentication.controls,
	disconnect.controls,
	userInfo.controls,
	error.controls
);

export const reducer = Data.addInitializeReducer(
	INITIAL_STATE,
	Data.collectReducers(
		authentication.reducer,
		disconnect.reducer,
		userInfo.reducer,
		error.reducer
	)
);

export const resolvers = Data.collectResolvers(
	authentication.resolvers,
	disconnect.resolvers,
	userInfo.resolvers,
	error.resolvers
);

export const selectors = Data.collectSelectors(
	authentication.selectors,
	disconnect.selectors,
	userInfo.selectors,
	error.selectors
);

const store = {
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};

// Register this store on the global registry.
Data.registerStore( STORE_NAME, store );

export default store;
