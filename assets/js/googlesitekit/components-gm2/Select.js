/**
 * Select component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * External dependencies
 */
import MaterialSelect from '@material/react-select';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

export default function Select( { id, ...props } ) {
	// For accessibility, provide a generated id fallback if an id
	// is not supplied. Adding an id is mandatory because otherwise the label
	// is not able to associate with the select.
	const idFallback = useInstanceId( Select, 'googlesitekit-select' );

	return <MaterialSelect id={ id || idFallback } { ...props } />;
}
