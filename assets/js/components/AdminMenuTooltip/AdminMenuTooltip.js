import { useCallback } from '@wordpress/element';

import { useDispatch, useSelect } from 'googlesitekit-data';
import JoyrideTooltip from '../JoyrideTooltip';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

export function AdminMenuTooltip() {
	const { setValue } = useDispatch( CORE_UI );

	const {
		isTooltipVisible = false,
		rehideAdminMenu = false,
		rehideAdminSubMenu = false,
		onDismiss,
		...tooltipSettings
	} = useSelect( ( select ) =>
		select( CORE_UI ).getValue( 'admin-menu-tooltip' )
	);

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

		await onDismiss?.();

		setValue( 'admin-menu-tooltip', undefined );
	}, [ onDismiss, rehideAdminMenu, rehideAdminSubMenu, setValue ] );

	if ( ! isTooltipVisible ) {
		return null;
	}

	return (
		<JoyrideTooltip
			// Point to the Site Kit Settings menu item by default.
			target={ '#adminmenu [href*="page=googlesitekit-settings"]' }
			slug="ga4-activation-banner-admin-menu-tooltip"
			onDismiss={ handleDismissTooltip }
			title=""
			{ ...tooltipSettings }
		/>
	);
}
