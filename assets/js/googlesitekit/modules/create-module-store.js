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
 * Internal dependencies
 */
import {
	createNotificationsStore,
} from 'assets/js/googlesitekit/data/create-notifications-store';

/**
 * Creates a base store object for a Site Kit module.
 *
 * Every module that intends to register its own store must use this function
 * to get the base store. It can then combine the base module with its own
 * selectors and actions to individualize the store.
 *
 * Each module store must be registered under 'modules/{slug}'.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Slug of the module that the store is for.
 * @return {Object} The base module store object.
 */
export const createModuleStore = ( slug ) => {
	// For now, a base module store only consists of the notifications functionality.
	return createNotificationsStore( 'modules', slug, 'notifications' );
};
