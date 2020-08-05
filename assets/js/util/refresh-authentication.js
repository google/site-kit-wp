/**
 * Refresh Authentication utility.
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
import data, { TYPE_CORE } from '../components/data';

export const refreshAuthentication = async () => {
	try {
		// `timestamp` added to ensure this request is always made as it is preloaded
		// using apiFetch's preloading middleware.
		const {
			authenticated: isAuthenticated,
			requiredScopes,
			grantedScopes,
			unsatisfiedScopes = [],
		} = await data.get( TYPE_CORE, 'user', 'authentication', { timestamp: Date.now() } );

		// We should really be using state management. This is terrible.
		// Hang in there... we're getting to it ;)
		global._googlesitekitLegacyData.setup = {
			...( global._googlesitekitLegacyData.setup || {} ),
			isAuthenticated,
			requiredScopes,
			grantedScopes,
			unsatisfiedScopes,
			needReauthenticate: 0 < unsatisfiedScopes.length,
		};
	} catch ( e ) { // eslint-disable-line no-empty
	}
};
