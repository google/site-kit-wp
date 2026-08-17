/**
 * `useQueryArg` hook.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * The parts of the global window object this hook reads from and writes to.
 */
interface QueryArgGlobal {
	location: {
		href: string;
	};
	history: {
		replaceState: History[ 'replaceState' ];
	};
}

/**
 * Uses a location query param as a variable in a component.
 *
 * @since 1.24.0
 *
 * @param {string} key            The query param key to be used.
 * @param {string} [initialValue] Optional. The initial value for the query param to be used.
 * @param {Object} [_global]      The global window object.
 * @return {Array} The getter and setter for the query param state.
 */
function useQueryArg< T = string >(
	key: string,
	initialValue?: T,
	_global: QueryArgGlobal = global
): [ T, ( newValue?: T ) => void ] {
	const [ value, setValue ] = useState(
		( getQueryArg( _global.location.href, key ) || initialValue ) as T
	);

	function onSetValue( newValue?: T ) {
		setValue( newValue as T );

		const url = new URL( _global.location.href );
		const { hash } = url;
		url.hash = '';

		const newURL =
			addQueryArgs( url.href, {
				[ key ]: newValue,
			} ) + hash;

		_global.history.replaceState( null, '', newURL );
	}

	return [ value, onSetValue ];
}

export default useQueryArg;
