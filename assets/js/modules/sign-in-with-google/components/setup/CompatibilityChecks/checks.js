/**
 * Sign in with Google compatibility check helpers.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';

/**
 * Runs the Sign in with Google compatibility checks.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Registry instance providing data store helpers.
 * @return {Function} Function that runs the checks when executed.
 */
export function runChecks( registry ) {
	return async () => {
		const compatibilityChecks = await registry
			.resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE )
			.getCompatibilityChecks();

		const checks = compatibilityChecks?.checks;

		if ( checks && Object.keys( checks ).length > 0 ) {
			throw checks;
		}
	};
}
