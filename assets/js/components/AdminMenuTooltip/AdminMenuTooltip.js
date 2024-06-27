import { useCallback } from '@wordpress/element';

import PropTypes from 'prop-types';

import { useDispatch } from 'googlesitekit-data';
import JoyrideTooltip from '../JoyrideTooltip';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { useTooltipState } from './useTooltipState';

export function AdminMenuTooltip( { onDismiss, tooltipStateKey, ...props } ) {
	const { setValue } = useDispatch( CORE_UI );

	const { rehideAdminMenu, rehideAdminSubMenu } =
		useTooltipState( tooltipStateKey );

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

		setValue( tooltipStateKey, undefined );
	}, [
		onDismiss,
		rehideAdminMenu,
		rehideAdminSubMenu,
		setValue,
		tooltipStateKey,
	] );

	return (
		<JoyrideTooltip
			slug="ga4-activation-banner-admin-menu-tooltip"
			onDismiss={ handleDismissTooltip }
			{ ...props }
		/>
	);
}

AdminMenuTooltip.propTypes = {
	...JoyrideTooltip.propTypes,
	target: PropTypes.string,
	tooltipStateKey: PropTypes.string.isRequired,
};

AdminMenuTooltip.defaultProps = {
	// Point to the Site Kit Settings menu item by default.
	target: '#adminmenu [href*="page=googlesitekit-settings"]',
};
