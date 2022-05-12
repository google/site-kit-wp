/**
 * `useViewContext` hook.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useContext } from '@wordpress/element';
import ViewContextContext from '../components/Root/ViewContextContext';

/**
 * Returns the current Site Kit viewing context, eg. "dashboard",
 * "entity dashboard", "view-only dashboard", etc.
 *
 * @since 1.74.0
 *
 * @return {string} The current "viewing context" value for the plugin.
 */
function useViewContext() {
	const viewContext = useContext( ViewContextContext );

	return viewContext;
}

export default useViewContext;
