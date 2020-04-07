/**
 * core/site data store
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
 * External dependencies
 */

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import connection from './connection';
import info from './info';
import reset from './reset';
import notifications from './notifications';

export const INITIAL_STATE = Data.collectState(
	connection.INITIAL_STATE,
	info.INITIAL_STATE,
	reset.INITIAL_STATE,
	notifications.INITIAL_STATE,
);

export const STORE_NAME = 'core/site';

export const actions = Data.addInitializeAction(
	Data.collectActions(
		Data.commonActions,
		connection.actions,
		info.actions,
		reset.actions,
		notifications.actions,
	)
);

export const controls = Data.collectControls(
	Data.commonControls,
	connection.controls,
	info.controls,
	reset.controls,
	notifications.controls,
);

export const reducer = Data.addInitializeReducer(
	INITIAL_STATE,
	Data.collectReducers(
		connection.reducer,
		info.reducer,
		reset.reducer,
		notifications.reducer,
	)
);

export const resolvers = Data.collectResolvers(
	connection.resolvers,
	info.resolvers,
	reset.resolvers,
	notifications.resolvers,
);

export const selectors = Data.collectSelectors(
	connection.selectors,
	info.selectors,
	reset.selectors,
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
