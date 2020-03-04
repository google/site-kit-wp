/**
 * Provides API functions to create a datastore for a module.
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
import data from 'googlesitekit-data';

/**
 * Internal dependencies
 */
import {
	INITIAL_STATE as INITIAL_NOTIFICATIONS_STATE,
	createNotificationsStore,
} from '../data/create-notifications-store';

const { collect, collectReducers } = data;

export const INITIAL_STATE = {
	...INITIAL_NOTIFICATIONS_STATE,
};

export const createModuleStore = ( slug ) => {
	const notifications = createNotificationsStore( 'modules', slug, 'notifications' );

	const actions = collect( notifications.actions );
	const controls = collect( notifications.controls );
	const reducer = collectReducers( INITIAL_STATE, [ notifications.reducer ] );
	const resolvers = collect( notifications.resolvers );
	const selectors = collect( notifications.resolvers );

	return {
		actions,
		controls,
		reducer,
		resolvers,
		selectors,
	};
};
