/**
 * Sign in with Google data requirements.
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
 * Internal dependencies
 */
import { Registry } from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';

/**
 * Returns a function that checks if the module reported any compatibility check errors.
 *
 * @since n.e.x.t
 *
 * @return {function(Registry): Promise<boolean>} Whether at least one compatibility check error was reported or not.
 */
export function requireCompatibilityCheckErrors() {
	return async ( { resolveSelect }: Registry ): Promise< boolean > => {
		const compatibilityChecks = await resolveSelect(
			MODULES_SIGN_IN_WITH_GOOGLE
		).getCompatibilityChecks();

		return Object.keys( compatibilityChecks?.checks || {} ).length > 0;
	};
}
