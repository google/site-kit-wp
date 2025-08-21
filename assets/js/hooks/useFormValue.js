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

/**
 * Returns the value of a form field.
 *
 * @since 1.160.0
 *
 * @param {string} formName The name of the form.
 * @param {string} key      The key of the form field.
 * @return {string|number|boolean|Array|Object|undefined} The value of the form field, or the default value if provided.
 */
export default function useFormValue( formName, key ) {
	return useSelect(
		( select ) => {
			const { getValue } = select( CORE_FORMS );

			return getValue( formName, key );
		},
		[ formName, key ]
	);
}
