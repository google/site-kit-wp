/**
 * `useViewOnly` hook.
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

/**
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_PAGE_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import ViewContextContext from '../components/Root/ViewContextContext';

/**
 * Determines if the current view context is a "view only" dashboard context.
 *
 * @since n.e.x.t
 *
 * @return {boolean} True if current context is a view-only dashboard context, false otherwise.
 */
export default function useViewOnly() {
	const viewContext = useContext( ViewContextContext );

	return (
		viewContext === VIEW_CONTEXT_DASHBOARD_VIEW_ONLY ||
		viewContext === VIEW_CONTEXT_PAGE_DASHBOARD_VIEW_ONLY
	);
}
