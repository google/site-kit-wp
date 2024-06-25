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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import AdSenseConnectCTA from '../common/AdSenseConnectCTA';
import {
	ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
	ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY,
} from '../../constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';

import {
	useShowTooltip,
	useTooltipState,
	AdminMenuTooltip,
} from '../../../../components/AdminMenuTooltip';

function AdSenseConnectCTAWidget( { Widget, WidgetNull } ) {
	const { dismissItem } = useDispatch( CORE_USER );

	const { isTooltipVisible } = useTooltipState(
		ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY
	);

	const viewContext = useViewContext();

	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'adsense' )
	);
	const hasDismissedWidget = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY
		)
	);

	const showTooltip = useShowTooltip( ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY );

	const handleDismissTooltip = useCallback( async () => {
		await trackEvent(
			`${ viewContext }_adsense-cta-widget`,
			'dismiss_tooltip'
		);
	}, [ viewContext ] );

	const handleDismissModule = useCallback( async () => {
		showTooltip();
		await dismissItem( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY );
	}, [ dismissItem, showTooltip ] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<WidgetNull />
				<AdminMenuTooltip
					title={ __(
						'You can always connect AdSense from here later',
						'google-site-kit'
					) }
					content={ __(
						'The Monetization section will be added back to your dashboard if you connect AdSense in Settings later',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					onDismiss={ handleDismissTooltip }
					tooltipStateKey={ ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY }
				/>
			</Fragment>
		);
	}

	// Check for `false` explicitly, as these variables will be `undefined`
	// while loading.
	if ( adSenseModuleConnected === false && hasDismissedWidget === false ) {
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
