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

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import useViewContext from '@/js/hooks/useViewContext';
import { trackEvent } from '@/js/util';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_FORM,
	MAX_SELECTED_AUDIENCES_COUNT,
	MIN_SELECTED_AUDIENCES_COUNT,
} from './constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { SelectionPanelFooter } from '@/js/components/SelectionPanel';
import useFormValue from '@/js/hooks/useFormValue';

export default function Footer( { isOpen, closePanel, savedItemSlugs } ) {
	const viewContext = useViewContext();

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
	const isSavingSettings = useSelect( ( select ) =>
		select( CORE_USER ).isSavingUserAudienceSettings()
	);
	const hiddenTileDismissedItems = useInViewSelect( ( select ) => {
		const dismissedItems = select( CORE_USER ).getDismissedItems();

		return dismissedItems?.filter( ( item ) =>
			item.startsWith( 'audience-tile-' )
		);
	} );
	const availableAudiences = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getOrSyncAvailableAudiences()
	);

	const { saveUserAudienceSettings, removeDismissedItems } =
		useDispatch( CORE_USER );

	const { getConfiguredAudiences } = useSelect( CORE_USER );

	const [ dismissedItemsError, setDismissedItemsError ] = useState( null );

	const saveSettings = useCallback(
		async ( selectedAudiences ) => {
			setDismissedItemsError( null );

			let { error } = await saveUserAudienceSettings( {
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
		[
			hiddenTileDismissedItems,
			removeDismissedItems,
			saveUserAudienceSettings,
		]
	);

	const onSaveSuccess = useCallback( () => {
		const audienceTypeLabels = {
			USER_AUDIENCE: 'user',
			SITE_KIT_AUDIENCE: 'site-kit',
			DEFAULT_AUDIENCE: 'default',
		};

		// Call to the selector within the callback ensures that the latest
		// value is used.
		const configuredAudiences = getConfiguredAudiences();

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
	}, [ availableAudiences, getConfiguredAudiences, viewContext ] );

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
