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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_FORM,
	MAX_SELECTED_AUDIENCES_COUNT,
	MIN_SELECTED_AUDIENCES_COUNT,
} from './constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { SelectionPanelFooter } from '../../../../../../components/SelectionPanel';

const { useSelect } = Data;

export default function Footer( { isOpen, closePanel } ) {
	const savedItemSlugs = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredAudiences()
	);
	const selectedItems = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SELECTION_FORM,
			AUDIENCE_SELECTED
		)
	);

	const selectedItemsCount = selectedItems?.length || 0;
	let metricsLimitError;

	if ( selectedItemsCount < MIN_SELECTED_AUDIENCES_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Minimum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select at least %1$d metrics (%2$d selected)',
				'google-site-kit'
			),
			MIN_SELECTED_AUDIENCES_COUNT,
			selectedItemsCount
		);
	} else if ( selectedItemsCount > MAX_SELECTED_AUDIENCES_COUNT ) {
		metricsLimitError = sprintf(
			/* translators: 1: Maximum number of metrics that can be selected. 2: Number of selected metrics. */
			__(
				'Select up to %1$d metrics (%2$d selected)',
				'google-site-kit'
			),

			MAX_SELECTED_AUDIENCES_COUNT,
			selectedItemsCount
		);
	}

	return (
		<SelectionPanelFooter
			savedItemSlugs={ savedItemSlugs }
			selectedItemSlugs={ selectedItems }
			saveSettings={ () => {} }
			saveError={ null }
			itemLimitError={ metricsLimitError }
			minSelectedItemCount={ MIN_SELECTED_AUDIENCES_COUNT }
			maxSelectedItemCount={ MAX_SELECTED_AUDIENCES_COUNT }
			isBusy={ false }
			onSaveSuccess={ () => {} }
			onCancel={ () => {} }
			isOpen={ isOpen }
			closePanel={ closePanel }
		/>
	);
}

Footer.propTypes = {
	isOpen: PropTypes.bool,
	closePanel: PropTypes.func.isRequired,
};
