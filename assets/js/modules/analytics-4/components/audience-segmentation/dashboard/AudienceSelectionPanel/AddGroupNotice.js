/**
 * Audience Selection Panel Add Group Notice
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
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	AUDIENCE_ADD_GROUP_NOTICE_SLUG,
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_FORM,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import InfoIcon from '../../../../../../../svg/icons/info-circle.svg';
import InfoNotice from '../InfoNotice';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';

export default function AddGroupNotice() {
	const [ twoOrMoreAudiencesSelected, setTwoOrMoreAudiencesSelected ] =
		useState( false );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( AUDIENCE_ADD_GROUP_NOTICE_SLUG )
	);
	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
	);
	const isLoading = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isFetchingSyncAvailableAudiences()
	);
	const selectedAudiences = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SELECTION_FORM,
			AUDIENCE_SELECTED
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );

	const onDismiss = useCallback( async () => {
		await dismissItem( AUDIENCE_ADD_GROUP_NOTICE_SLUG );
	}, [ dismissItem ] );

	useEffect( () => {
		if ( ! Array.isArray( selectedAudiences ) ) {
			return;
		}

		if ( selectedAudiences.length > 1 ) {
			setTwoOrMoreAudiencesSelected( true );
		}

		// If selected items changed to only 1 or less selected audiences
		// reset the value. Otherwise `twoOrMoreAudiencesSelected` always remains `true`.
		// We are checking if selection panel is closed to do that, so notice is not re-surfaced
		// while selection panel is still open.
		if ( ! isSelectionPanelOpen && selectedAudiences?.length === 1 ) {
			setTwoOrMoreAudiencesSelected( false );
		}
	}, [
		selectedAudiences,
		isSelectionPanelOpen,
		setTwoOrMoreAudiencesSelected,
	] );

	// Do not render the notice if the slection panel is dismissed, has two or more
	// audiences selected, or the items are showing as preview blocks - re-syncing is still in progress.
	if ( isDismissed || twoOrMoreAudiencesSelected || isLoading ) {
		return null;
	}

	return (
		<InfoNotice
			className="googlesitekit-audience-selection-panel__add-group-notice"
			content={ __(
				'By adding another group to your dashboard, you will be able to compare them and understand which content brings back users from each group',
				'google-site-kit'
			) }
			dismissLabel={ __( 'Got it', 'google-site-kit' ) }
			Icon={ InfoIcon }
			onDismiss={ onDismiss }
		/>
	);
}

AddGroupNotice.propTypes = {
	savedItemSlugs: PropTypes.array,
};
