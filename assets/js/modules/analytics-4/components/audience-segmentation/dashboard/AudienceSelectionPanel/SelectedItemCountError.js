/**
 * Audience Selection Panel Selected Item Count Error Notice
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from '@/js/googlesitekit-data';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_FORM,
	MAX_SELECTED_AUDIENCES_COUNT,
	MIN_SELECTED_AUDIENCES_COUNT,
} from './constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import SelectionPanelError from '@/js/components/SelectionPanel/SelectionPanelError';
import { useMemo } from '@wordpress/element';
import { isEqual } from 'lodash';
import { safelySort } from '@/js/util';

export default function SelectedItemCountError( { savedItemSlugs } ) {
	const selectedItems = useFormValue(
		AUDIENCE_SELECTION_FORM,
		AUDIENCE_SELECTED
	);

	const audienceSettings = useInViewSelect( ( select ) =>
		select( CORE_USER ).getUserAudienceSettings()
	);
	const saveError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveUserAudienceSettings', [
			{
				...audienceSettings,
				configuredAudiences: selectedItems,
			},
		] )
	);

	const selectedItemsCount = selectedItems?.length || 0;
	let itemLimitError;

	if ( selectedItemsCount < MIN_SELECTED_AUDIENCES_COUNT ) {
		itemLimitError = sprintf(
			/* translators: 1: Minimum number of groups that can be selected. 2: Number of selected groups. */
			_n(
				'Select at least %1$d group (%2$d selected)',
				'Select at least %1$d groups (%2$d selected)',
				MIN_SELECTED_AUDIENCES_COUNT,
				'google-site-kit'
			),
			MIN_SELECTED_AUDIENCES_COUNT,
			selectedItemsCount
		);
	} else if ( selectedItemsCount > MAX_SELECTED_AUDIENCES_COUNT ) {
		itemLimitError = sprintf(
			/* translators: 1: Maximum number of groups that can be selected. 2: Number of selected groups. */
			__( 'Select up to %1$d groups (%2$d selected)', 'google-site-kit' ),
			MAX_SELECTED_AUDIENCES_COUNT,
			selectedItemsCount
		);
	}

	const haveSettingsChanged = useMemo( () => {
		// Arrays need to be sorted to match in `isEqual`.
		return ! isEqual(
			safelySort( selectedItems ),
			safelySort( savedItemSlugs )
		);
	}, [ selectedItems, savedItemSlugs ] );

	if ( ! itemLimitError && ! saveError ) {
		return null;
	}

	let error = saveError;

	if ( haveSettingsChanged && itemLimitError ) {
		error = { message: itemLimitError };
	}

	return <SelectionPanelError error={ error } />;
}
