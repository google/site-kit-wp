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
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import useViewContext from '../../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../../util';
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
	const viewContext = useViewContext();

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
		select( CORE_USER ).isSavingAudienceSettings()
	);
	const hiddenTileDismissedItems = useSelect( ( select ) => {
		const dismissedItems = select( CORE_USER ).getDismissedItems();

		return dismissedItems?.filter( ( item ) =>
			item.startsWith( 'audience-tile-' )
		);
	} );
	const availableAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAvailableAudiences()
	);
	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);

	const { saveAudienceSettings, removeDismissedItems } =
		useDispatch( CORE_USER );

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

	const [ dismissedItemsError, setDismissedItemsError ] = useState( null );

	const saveSettings = useCallback(
		async ( selectedAudiences ) => {
			setDismissedItemsError( null );

			let { error } = await saveAudienceSettings( {
				configuredAudiences: selectedAudiences,
			} );

			if ( ! error ) {
				// Determine the list of hidden audiences that have been unselected and need their dismissed state to be cleared.
				const hiddenAudienceDismissedItemsToClear =
					hiddenTileDismissedItems?.filter( ( item ) => {
						const audienceResourceName = item.replace(
							'audience-tile-',
							''
						);
						return ! selectedAudiences.includes(
							audienceResourceName
						);
					} ) || [];

				// If all configured audiences are hidden, clear the dismissed state for the first one to unhide it
				if (
					selectedAudiences.every( ( audienceResourceName ) =>
						hiddenTileDismissedItems?.includes(
							`audience-tile-${ audienceResourceName }`
						)
					)
				) {
					hiddenAudienceDismissedItemsToClear.push(
						`audience-tile-${ selectedAudiences[ 0 ] }`
					);
				}

				if ( hiddenAudienceDismissedItemsToClear?.length > 0 ) {
					( { error } = await removeDismissedItems(
						...hiddenAudienceDismissedItemsToClear
					) );

					if ( error ) {
						setDismissedItemsError( error );
					}
				}
			}

			return { error };
		},
		[ hiddenTileDismissedItems, removeDismissedItems, saveAudienceSettings ]
	);

	const onSaveSuccess = useCallback( () => {
		const audienceTypeLabels = {
			USER_AUDIENCE: 'user',
			SITE_KIT_AUDIENCE: 'site-kit',
			DEFAULT_AUDIENCE: 'default',
		};

		const eventLabel = Object.keys( audienceTypeLabels )
			.map( ( type ) => {
				const audiencesOfType = configuredAudiences.filter(
					( audienceName ) => {
						const audience = availableAudiences?.find(
							( { name } ) => audienceName === name
						);

						return audience?.audienceType === type;
					}
				);

				return `${ audienceTypeLabels[ type ] }:${ audiencesOfType.length }`;
			} )
			.join( ',' );

		trackEvent(
			`${ viewContext }_audiences-sidebar`,
			'audiences_sidebar_save',
			eventLabel
		);
	}, [ availableAudiences, configuredAudiences, viewContext ] );

	const onCancel = useCallback( () => {
		trackEvent(
			`${ viewContext }_audiences-sidebar`,
			'audiences_sidebar_cancel'
		);
	}, [ viewContext ] );

	return (
		<SelectionPanelFooter
			savedItemSlugs={ savedItemSlugs }
			selectedItemSlugs={ selectedItems }
			saveSettings={ saveSettings }
			saveError={ saveError || dismissedItemsError }
			itemLimitError={ itemLimitError }
			minSelectedItemCount={ MIN_SELECTED_AUDIENCES_COUNT }
			maxSelectedItemCount={ MAX_SELECTED_AUDIENCES_COUNT }
			isBusy={ isSavingSettings }
			isOpen={ isOpen }
			closePanel={ closePanel }
			onSaveSuccess={ onSaveSuccess }
			onCancel={ onCancel }
		/>
	);
}

Footer.propTypes = {
	isOpen: PropTypes.bool,
	closePanel: PropTypes.func.isRequired,
	savedItemSlugs: PropTypes.array,
};
