import { useCallback } from '@wordpress/element';

import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

const { useDispatch } = Data;

export function useShowTooltip( tooltipStateKey ) {
	const { setValue } = useDispatch( CORE_UI );

	return useCallback( async () => {
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

		setValue( tooltipStateKey, {
			isTooltipVisible: true,
			rehideAdminMenu: ! isAdminMenuOpen,
			rehideAdminSubMenu: isAdminSubMenuHidden,
		} );
	}, [ setValue, tooltipStateKey ] );
}
