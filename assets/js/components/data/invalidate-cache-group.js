/**
 * Data API: Cache group invalidation.
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
import { getStorage } from '../../util/storage';
import { getCacheKey, lazilySetupLocalCache } from './cache';

/**
 * Invalidates all caches associated with a specific cache group.
 *
 * @since 1.0.0
 *
 * @param {string} type       The data to access. One of 'core' or 'modules'.
 * @param {string} identifier The data identifier, for example a module slug.
 * @param {string} datapoint  The datapoint.
 */
export const invalidateCacheGroup = ( type, identifier, datapoint ) => {
	const groupPrefix = getCacheKey( type, identifier, datapoint );

	lazilySetupLocalCache();

	Object.keys( global._googlesitekitLegacyData.admin.datacache ).forEach( ( key ) => {
		if ( 0 === key.indexOf( groupPrefix + '::' ) || key === groupPrefix ) {
			delete global._googlesitekitLegacyData.admin.datacache[ key ];
		}
	} );

	Object.keys( getStorage() ).forEach( ( key ) => {
		if ( 0 === key.indexOf( `googlesitekit_${ groupPrefix }::` ) || key === `googlesitekit_${ groupPrefix }` ) {
			getStorage().removeItem( key );
		}
	} );
};
