/**
 * Audience Selection Panel Footer
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_FORM,
	MAX_SELECTED_AUDIENCES_COUNT,
	MIN_SELECTED_AUDIENCES_COUNT,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { SelectionPanelFooter } from '../../../../../../components/SelectionPanel';

export default function Footer( { isOpen, closePanel, savedItemSlugs } ) {
	const selectedItems = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SELECTION_FORM,
			AUDIENCE_SELECTED
		)
	);
	const audienceSettings = useSelect( ( select ) =>
		select( CORE_USER ).getAudienceSettings()
	);
	const saveError = useSelect( ( select ) =>
		select( CORE_USER ).getErrorForAction( 'saveAudienceSettings', [
			{
				...audienceSettings,
				configuredAudiences: selectedItems,
			},
		] )
	);
	const isSavingSettings = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isSavingAudienceSettings()
	);

	const { saveAudienceSettings } = useDispatch( CORE_USER );

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

	const saveSettings = useCallback(
		async ( configuredAudiences ) => {
			const { error } = await saveAudienceSettings( {
				configuredAudiences,
			} );

			return { error };
		},
		[ saveAudienceSettings ]
	);

	return (
		<SelectionPanelFooter
			savedItemSlugs={ savedItemSlugs }
			selectedItemSlugs={ selectedItems }
			saveSettings={ saveSettings }
			saveError={ saveError }
			itemLimitError={ itemLimitError }
			minSelectedItemCount={ MIN_SELECTED_AUDIENCES_COUNT }
			maxSelectedItemCount={ MAX_SELECTED_AUDIENCES_COUNT }
			isBusy={ isSavingSettings }
			isOpen={ isOpen }
			closePanel={ closePanel }
		/>
	);
}

Footer.propTypes = {
	isOpen: PropTypes.bool,
	closePanel: PropTypes.func.isRequired,
	savedItemSlugs: PropTypes.array,
};
