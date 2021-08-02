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
 * Uses a location query param as a variable in a component.
 *
 * @since 1.24.0
 *
 * @param {string} key            The query param key to be used.
 * @param {string} [initialValue] Optional. The initial value for the query param to be used.
 * @param {Object} [_global]      The global window object.
 * @return {Array} The getter and setter for the query param state.
 */
function useQueryArg( key, initialValue, _global = global ) {
	const [ value, setValue ] = useState(
		getQueryArg( _global.location.href, key ) || initialValue
	);

	const onSetValue = ( newValue ) => {
		setValue( newValue );

		const newURL = addQueryArgs( _global.location.href, {
			[ key ]: newValue,
		} );
		_global.history.replaceState( null, '', newURL );
	};

	return [ value, onSetValue ];
}

export default useQueryArg;
