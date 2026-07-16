/**
 * `useUIValue` hook.
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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

/**
 * Returns the value of a UI key.
 *
 * @since n.e.x.t
 *
 * @param {string} key Ui key.
 * @return {Array} An array containing the value and a function to update it.
 */
export default function useUIValue< T = unknown >(
	key: string
): [ T | undefined, ( value: T ) => void ] {
	const { setValue: setStoreValue } = useDispatch( CORE_UI );

	const setValue = useCallback(
		( value: T ) => {
			setStoreValue( key, value );
		},
		[ setStoreValue, key ]
	);

	const value = useSelect(
		( select: Select ) =>
			select( CORE_UI ).getValue( key ) as T | undefined,
		[ key ]
	);

	return [ value, setValue ];
}
