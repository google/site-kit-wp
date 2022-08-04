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
import Data from 'googlesitekit-data';
import AdSenseConnectCTA from '../common/AdSenseConnectCTA';
import {
	ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
	ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY,
} from '../../constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import Tooltip from '../../../../components/Tooltip';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
const { useDispatch, useSelect } = Data;

function AdSenseConnectCTAWidget( { Widget, WidgetNull } ) {
	const { dismissItem } = useDispatch( CORE_USER );
	const { setValue } = useDispatch( CORE_UI );

	const { isTooltipVisible, rehideAdminMenu, rehideAdminSubMenu } = useSelect(
		( select ) =>
			select( CORE_UI ).getValue(
				ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY
			) || {
				isTooltipVisible: false,
				rehideAdminMenu: false,
				rehideAdminSubMenu: false,
			}
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

	const onDismissModule = useCallback( async () => {
		// Check if the WordPress admin menu is open, and if not, open it.
		// The admin menu is hidden via responsive CSS. This is a simple and effective way to check if it's visible.
		const isAdminMenuOpen =
			document.querySelector( '#adminmenu' ).offsetHeight > 0;

		if ( ! isAdminMenuOpen ) {
			const adminMenuToggle = document.getElementById(
				'wp-admin-bar-menu-toggle'
			);

			if ( adminMenuToggle ) {
				adminMenuToggle.click();

				// On iOS, at least, this is necessary, without it the settings menu item
				// is not scrolled into view when the Tooltip is shown.
				await new Promise( ( resolve ) => {
					setTimeout( resolve, 0 );
				} );
			}
		}

		// Check if the Site Kit admin submenu is hidden, and if so, show it.
		const adminSubMenuSelector =
			"#adminmenu [href*='page=googlesitekit-dashboard']";
		const isAdminSubMenuHidden = !! document.querySelector(
			`${ adminSubMenuSelector }[aria-haspopup=true]`
		);

		if ( isAdminSubMenuHidden ) {
			document.querySelector( adminSubMenuSelector ).click();
		}

		setValue( ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY, {
			isTooltipVisible: true,
			rehideAdminMenu: ! isAdminMenuOpen,
			rehideAdminSubMenu: isAdminSubMenuHidden,
		} );
	}, [ setValue ] );

	const handleDismissTooltip = useCallback( async () => {
		// If the WordPress admin menu was closed, re-close it.
		if ( rehideAdminMenu ) {
			const isAdminMenuOpen =
				document.querySelector( '#adminmenu' ).offsetHeight > 0;

			if ( isAdminMenuOpen ) {
				document.getElementById( 'wp-admin-bar-menu-toggle' )?.click();
			}
		}

		// If the Site Kit admin submenu was hidden, re-hide it.
		if ( rehideAdminSubMenu ) {
			// Click on the body to close the submenu.
			document.querySelector( 'body' ).click();
		}

		await trackEvent(
			`${ viewContext }_adsense-cta-widget`,
			'dismiss_tooltip'
		);
		await dismissItem( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY );

		setValue( ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY, undefined );
	}, [
		dismissItem,
		rehideAdminMenu,
		rehideAdminSubMenu,
		setValue,
		viewContext,
	] );

	if ( isTooltipVisible ) {
		return (
			<Fragment>
				<WidgetNull />
				<Tooltip
					title={ __(
						'You can always connect AdSense from here later',
						'google-site-kit'
					) }
					content={ __(
						'The Monetization section will be added back to your dashboard if you connect AdSense in Settings later.',
						'google-site-kit'
					) }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					target="#adminmenu [href*='page=googlesitekit-settings']"
					onDismiss={ handleDismissTooltip }
				/>
			</Fragment>
		);
	}

	if ( adSenseModuleConnected || hasDismissedWidget ) {
		return <WidgetNull />;
	}

	return (
		<Widget noPadding>
			<AdSenseConnectCTA onDismissModule={ onDismissModule } />
		</Widget>
	);
}

AdSenseConnectCTAWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default AdSenseConnectCTAWidget;
