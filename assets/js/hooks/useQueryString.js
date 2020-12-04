/**
 * `useQueryString` hook.
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
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

/**
 * Uses a location query param as a state.
 *
 * @since n.e.x.t
 *
 * @param {string}        key          The query param key to be used.
 * @param {(string|null)} initialValue The initial value for the query param to be used.
 * @return {Array} The getter and setter for the query param state.
 */
function useQueryString( key, initialValue = null ) {
	const [ value, setValue ] = useState( new URLSearchParams( global.location.search ).get( key ) || initialValue );
	const onSetValue = useCallback(
		( newValue ) => {
			setValue( newValue );

			const urlParams = new URLSearchParams( global.location.search );
			urlParams.set( key, value );

			const newURL = `${ global.location.pathname }?${ urlParams.toString() }`;
			global.history.replaceState( { path: newURL }, '', newURL );
		},
		[ key ]
	);

	return [ value, onSetValue ];
}

export default useQueryString;
