/**
 * `useCategorySelection` hook.
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
 * External dependencies
 */
import { useCallback, useState } from 'react';

/**
 * Internal dependencies
 */

/**
 * Tracks selected category chips and toggles them according to hub rules.
 *
 * @since 1.186.0
 *
 * @param {Array<string>} initialSelection Initial chip selection.
 * @return {Array} Selected categories and toggle callback.
 */
export function useCategorySelection( initialSelection = [] ) {
	const [ selectedCategories, setSelectedCategories ] =
		useState( initialSelection );

	const onToggleCategory = useCallback( ( categorySlug ) => {
		if ( categorySlug === null ) {
			setSelectedCategories( [] );
			return;
		}

		setSelectedCategories( ( currentSelection ) => {
			if ( currentSelection.includes( categorySlug ) ) {
				return currentSelection.filter(
					( category ) => category !== categorySlug
				);
			}

			return [ ...currentSelection, categorySlug ];
		} );
	}, [] );

	return [ selectedCategories, onToggleCategory ];
}
export default useCategorySelection;
