/**
 * Idea Hub Module utilities.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';

/**
 * Checks whether the idea hub module is connected or not.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Datastore registry.
 * @return {boolean} Returns true if the module is connected, otherwise false.
 */
export const isIdeaHubModuleConnected = async ( registry ) => {
	await registry.__experimentalResolveSelect( CORE_MODULES ).getModules();

	return registry.select( CORE_MODULES ).isModuleConnected( 'idea-hub' );
};
