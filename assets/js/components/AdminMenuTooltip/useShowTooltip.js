import { useCallback } from '@wordpress/element';

import { useDispatch } from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

export function useShowTooltip( tooltipSettings ) {
	const { setValue } = useDispatch( CORE_UI );

	return useCallback( () => {
		setValue( 'admin-menu-tooltip', {
			isTooltipVisible: true,
			...tooltipSettings,
		} );
	}, [ setValue, tooltipSettings ] );
}
