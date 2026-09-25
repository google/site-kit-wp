/**
 * `core/intents` data store.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { combineStores, commonStore } from 'googlesitekit-data';
import { createErrorStore } from '@/js/googlesitekit/data/create-error-store';
import { CORE_INTENTS } from './constants';
import intents from './intents';

const store = combineStores(
	commonStore,
	intents,
	createErrorStore( CORE_INTENTS )
);

/**
 * Registers the `core/intents` data store on a registry.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to register the data store on.
 * @return {void}
 */
export function registerStore( registry: WPDataRegistry ): void {
	registry.registerStore( CORE_INTENTS, store );
}
