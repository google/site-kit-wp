/**
 * AdSenseConnectCTAWidget component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import AdSenseConnectCTA from '@/js/modules/adsense/components/common/AdSenseConnectCTA';
import {
	ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
	ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY,
	MODULE_SLUG_ADSENSE,
} from '@/js/modules/adsense/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

import { useShowTooltip } from '@/js/components/AdminScreenTooltip';

function AdSenseConnectCTAWidget( { Widget, WidgetNull } ) {
	const { dismissItem } = useDispatch( CORE_USER );

	const tooltipSettings = {
		tooltipSlug: ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY,
		title: __(
			'You can always connect AdSense from here later',
			'google-site-kit'
		),
		content: __(
			'The Monetization section will be added back to your dashboard if you connect AdSense in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ADSENSE )
	);
	const hasDismissedWidget = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY
		)
	);
	const isDismissingItem = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY
		)
	);

	const handleDismissModule = useCallback( async () => {
		// Scroll to the top for a better UX, as other widgets get in the way and make it seem like the dismissal is still loading
		global.scrollTo( {
			top: 0,
			left: 0,
			behavior: 'smooth',
		} );
		showTooltip();
		await dismissItem( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY );
	}, [ dismissItem, showTooltip ] );

	// Check for `false` explicitly, as these variables will be `undefined`
	// while loading.
	if (
		adSenseModuleConnected === false &&
		hasDismissedWidget === false &&
		isDismissingItem === false
	) {
		return (
			<Widget noPadding>
				<AdSenseConnectCTA onDismissModule={ handleDismissModule } />
			</Widget>
		);
	}

	return <WidgetNull />;
}

AdSenseConnectCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default AdSenseConnectCTAWidget;
