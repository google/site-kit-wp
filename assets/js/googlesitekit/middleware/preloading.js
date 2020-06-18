/**
 * Custom preloading middleware.
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
 * WordPress dependencies.
 */
import { getStablePath } from '@wordpress/api-fetch/build/middlewares/preloading';
import { addQueryArgs } from '@wordpress/url';

/**
 * Helper to remove the timestamp query param
 *
 * @param {string} uri The URI to remove the timestamp query param from.
 *
 * @return {string} Passed URI without the timestamp query param
 */
function removeTimestampQueryParam( uri ) {
	const [ baseUrl, queryParams ] = uri.split( '?' );

	const paramsObject = queryParams.split( '&' )?.reduce( ( acc, paramSet ) => {
		const split = paramSet.split( '=' );
		if ( split[ 0 ] !== 'timestamp' ) {
			return { ...acc, [ split[ 0 ] ]: split[ 1 ] };
		}
	}, {} );

	return addQueryArgs( baseUrl, paramsObject );
}

function createPreloadingMiddleware( preloadedData ) {
	const cache = Object.keys( preloadedData ).reduce( ( result, path ) => {
		result[ getStablePath( path ) ] = preloadedData[ path ];
		return result;
	}, {} );

	return ( options, next ) => {
		const { parse = true } = options;
		let uri = options.path;
		let deleteCache = false;
		if ( typeof options.path === 'string' ) {
			const method = options.method || 'GET';
			if ( options.path.match( /timestamp=[0-9]+/ ) ) {
				uri = removeTimestampQueryParam( options.path );
				deleteCache = true;
			}
			const path = getStablePath( uri );
			if ( parse && 'GET' === method && cache[ path ] ) {
				const result = Promise.resolve( cache[ path ].body );
				if ( deleteCache ) {
					delete cache[ path ];
				}
				return result;
			} else if (
				'OPTIONS' === method &&
				cache[ method ] &&
				cache[ method ][ path ]
			) {
				const result = Promise.resolve( cache[ method ][ path ] );
				if ( deleteCache ) {
					delete cache[ method ][ path ];
				}
				return result;
			}
		}
		return next( options );
	};
}
export default createPreloadingMiddleware;
