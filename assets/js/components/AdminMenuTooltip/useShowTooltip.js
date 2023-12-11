import { useCallback } from '@wordpress/element';

import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

const { useDispatch, useSelect } = Data;

export function useShowTooltip( tooltipStateKey ) {
	const { setValue } = useDispatch( CORE_UI );

	const hasMinimumWordPress62 = useSelect( ( select ) =>
		select( CORE_SITE ).hasMinimumWordPressVersion( '6.2' )
	);

	const hasMinimumWordPress64 = useSelect( ( select ) =>
		select( CORE_SITE ).hasMinimumWordPressVersion( '6.4' )
	);

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
				adminMenuToggle.firstChild.click();

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

		// This is a hack to prevent the WordPress admin menu from auto-closing when the tooltip takes the focus.
		// This is applicable for WordPress versions 6.2 and 6.3.
		// See https://github.com/WordPress/wordpress-develop/commit/a9fc43e.
		// It's no longer needed from 6.4, see https://github.com/WordPress/wordpress-develop/commit/93cc3b17.
		if ( hasMinimumWordPress62 && ! hasMinimumWordPress64 ) {
			const originalHasFocus = document.hasFocus;
			document.hasFocus = () => {
				document.hasFocus = originalHasFocus;
				return false;
			};
		}

		setValue( tooltipStateKey, {
			isTooltipVisible: true,
			rehideAdminMenu: ! isAdminMenuOpen,
			rehideAdminSubMenu: isAdminSubMenuHidden,
		} );
	}, [
		hasMinimumWordPress62,
		hasMinimumWordPress64,
		setValue,
		tooltipStateKey,
	] );
}
