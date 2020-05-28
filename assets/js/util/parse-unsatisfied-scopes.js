/**
 * parseUnsatisfiedScopes utility.
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
 * Parses the list of unsatisfied scopes and returns only the scope and sub-scopes.
 *
 * @param {Array}  unsatisfiedScopes An array of unsatisfied scopes.
 *
 * @return {Array} The parsed array of scopes and sub-scopes.
 */
const parseUnsatisfiedScopes = ( unsatisfiedScopes ) => {
	return unsatisfiedScopes
		// Remove all of the unparseable scopes such as 'openid'
		.filter( ( scope ) => scope.match( /https:\/\/www.googleapis.com\/auth\// ) )
		// Only include the scope and any sub-scopes in the strings
		.map( ( scope ) => scope.match( /https:\/\/www.googleapis.com\/auth\/([a-z\.]+)/ )[ 1 ] )
		// split each scope into arrays i.e 'analytics.read' becomes [ 'analytics', 'read' ]
		.map( ( scope ) => scope.split( '.' ) );
};

export default parseUnsatisfiedScopes;
