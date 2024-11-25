/**
 * Audience Selection Panel AudienceItem
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_CHANGED,
	AUDIENCE_SELECTION_FORM,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import { numFmt } from '../../../../../../util';
import NewBadge from '../../../../../../components/NewBadge';
import { SelectionPanelItem } from '../../../../../../components/SelectionPanel';
import BadgeWithTooltip from '../../../../../../components/BadgeWithTooltip';

export default function AudienceItem( {
	slug,
	title,
	description,
	subtitle,
	userCount,
	audienceType,
} ) {
	const newBadgeSlug = `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ slug }`;

	const selectedItems = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue(
			AUDIENCE_SELECTION_FORM,
			AUDIENCE_SELECTED
		)
	);
	const hasNewBadgeBeenSeen = useSelect( ( select ) =>
		select( CORE_USER ).hasExpirableItem( newBadgeSlug )
	);
	const isNewBadgeActive = useSelect( ( select ) =>
		select( CORE_USER ).isExpirableItemActive( newBadgeSlug )
	);
	const [ siteKitUserCountReportError, otherUserCountReportError ] =
		useSelect( ( select ) =>
			select( MODULES_ANALYTICS_4 ).getAudienceUserCountReportErrors()
		) || [];

	const errors = [];

	if ( otherUserCountReportError ) {
		errors.push( otherUserCountReportError );
	}

	if ( siteKitUserCountReportError ) {
		errors.push( siteKitUserCountReportError );
	}

	const { setValues } = useDispatch( CORE_FORMS );

	const temporarilyHidden = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( `audience-tile-${ slug }` )
	);

	const onCheckboxChange = useCallback(
		( event ) => {
			setValues( AUDIENCE_SELECTION_FORM, {
				[ AUDIENCE_SELECTED ]: event.target.checked
					? selectedItems.concat( [ slug ] )
					: selectedItems.filter(
							( selectedItem ) => selectedItem !== slug
					  ),
				[ AUDIENCE_SELECTION_CHANGED ]: true,
			} );
		},
		[ selectedItems, setValues, slug ]
	);

	// Show the new badge if it has not been seen yet, or the badge has been
	// seen and is still active.
	const showNewBadge =
		'DEFAULT_AUDIENCE' !== audienceType &&
		( hasNewBadgeBeenSeen === false || isNewBadgeActive );

	const isItemSelected = selectedItems?.includes( slug );

	const id = `audience-selection-checkbox-${ slug }`;

	function ItemBadge() {
		if ( temporarilyHidden ) {
			return (
				<BadgeWithTooltip
					label={ __( 'Temporarily hidden', 'google-site-kit' ) }
					tooltipTitle={ __(
						'Site Kit is collecting data for this group. Once data is available the group will be added to your dashboard.',
						'google-site-kit'
					) }
				/>
			);
		} else if ( showNewBadge ) {
			return <NewBadge />;
		}

		return null;
	}

	return (
		<SelectionPanelItem
			id={ id }
			slug={ slug }
			title={ title }
			subtitle={ subtitle }
			description={ description }
			isItemSelected={ isItemSelected }
			onCheckboxChange={ onCheckboxChange }
			suffix={ errors.length ? '-' : numFmt( userCount ) }
			badge={ ( temporarilyHidden || showNewBadge ) && <ItemBadge /> }
		/>
	);
}

AudienceItem.propTypes = {
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	subtitle: PropTypes.string,
	userCount: PropTypes.number.isRequired,
	audienceType: PropTypes.string.isRequired,
};
