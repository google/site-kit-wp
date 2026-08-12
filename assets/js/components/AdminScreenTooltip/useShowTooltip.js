/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

export function useShowTooltip( tooltipSettings ) {
	const { setValue } = useDispatch( CORE_UI );

	return useCallback( () => {
		setValue( 'admin-screen-tooltip', {
			isTooltipVisible: true,
			...tooltipSettings,
		} );
	}, [ setValue, tooltipSettings ] );
}
