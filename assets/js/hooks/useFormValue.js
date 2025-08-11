/**
 * Form value hook.
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
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { CORE_FORMS } from '../googlesitekit/datastore/forms/constants';

const useFormValue = ( formName, key, defaulValue ) => {
	return useSelect(
		( select ) => {
			const { getValue } = select( CORE_FORMS );

			const value = getValue( formName, key );

			if ( value === undefined && defaulValue !== undefined ) {
				return defaulValue;
			}

			return value;
		},
		[ formName, key ]
	);
};

export default useFormValue;
