/**
 * Utility function to check whether or not a view-context is a Site Kit view.
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
 * Internal dependencies
 */
import { SITE_KIT_VIEW_CONTEXTS } from '../googlesitekit/constants';

/**
 * Checks whether or not the current viewContext is a Site Kit screen.
 *
 * @since 1.80.0
 *
 * @param {string} viewContext The view-context.
 * @return {boolean} TRUE if the passed view-context is a site kit view; otherwise FALSE.
 */
export const isSiteKitScreen = ( viewContext ) =>
	SITE_KIT_VIEW_CONTEXTS.includes( viewContext );
