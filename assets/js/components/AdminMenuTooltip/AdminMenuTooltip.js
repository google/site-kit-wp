/**
 * AdminMenuTooltip component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import JoyrideTooltip from '../JoyrideTooltip';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

export function AdminMenuTooltip() {
	const viewContext = useViewContext();
	const { setValue } = useDispatch( CORE_UI );

	const {
		isTooltipVisible = false,
		rehideAdminMenu = false,
		rehideAdminSubMenu = false,
		tooltipSlug,
		title,
		content,
		dismissLabel,
	} = useSelect(
		( select ) =>
			select( CORE_UI ).getValue( 'admin-menu-tooltip' ) || {
				isTooltipVisible: false,
			}
	);

	const handleViewTooltip = () => {
		trackEvent( `${ viewContext }_${ tooltipSlug }`, 'tooltip_view' );
	};

	const handleDismissTooltip = useCallback( () => {
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

		// Track dismiss event.
		if ( tooltipSlug ) {
			trackEvent(
				`${ viewContext }_${ tooltipSlug }`,
				'tooltip_dismiss'
			);
		}

		setValue( 'admin-menu-tooltip', undefined );
	}, [
		rehideAdminMenu,
		rehideAdminSubMenu,
		setValue,
		tooltipSlug,
		viewContext,
	] );

	if ( ! isTooltipVisible ) {
		return null;
	}

	return (
		<JoyrideTooltip
			// Point to the Site Kit Settings menu item by default.
			target={ '#adminmenu [href*="page=googlesitekit-settings"]' }
			slug="ga4-activation-banner-admin-menu-tooltip"
			title={ title }
			content={ content }
			dismissLabel={ dismissLabel }
			onView={ handleViewTooltip }
			onDismiss={ handleDismissTooltip }
		/>
	);
}
