/**
 * Utility functions with minimal dependencies (only 'wp-i18n').
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Gets a query parameter from the current URL. (Fallback.)
 *
 * Used when URL.searchParams is unavailable.
 *
 * @since 1.2.0
 *
 * @param {string} name Query param to search for.
 * @return {string}	Matching query param from the current URL.
 */
const fallbackGetQueryParameter = ( name ) => {
	const queries = location.search.substr( 1 ).split( '&' );
	const queryDict = {};

	for ( let i = 0; i < queries.length; i++ ) {
		queryDict[ queries[ i ].split( '=' )[ 0 ] ] = decodeURIComponent(
			queries[ i ].split( '=' )[ 1 ]
		);
	}

	// If the name is specified, return that specific get parameter
	if ( name ) {
		return queryDict.hasOwnProperty( name )
			? decodeURIComponent( queryDict[ name ].replace( /\+/g, ' ' ) )
			: '';
	}

	return queryDict;
};

/**
 * Gets the query parameter from the current URL.
 *
 * @since 1.2.0
 *
 * @param {string} name      Query param to search for.
 * @param {Object} _location Global `location` variable; used for DI-testing.
 * @return {string}           Value of the query param.
 */
export const getQueryParameter = ( name, _location = location ) => {
	const url = new URL( _location.href );
	if ( name ) {
		if ( ! url.searchParams || ! url.searchParams.get ) {
			return fallbackGetQueryParameter( name );
		}
		return url.searchParams.get( name );
	}
	const query = {};
	for ( const [ key, value ] of url.searchParams.entries() ) {
		query[ key ] = value;
	}
	return query;
};
