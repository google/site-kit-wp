import { useSelect } from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

export function useTooltipState( tooltipStateKey ) {
	return useSelect(
		( select ) =>
			select( CORE_UI ).getValue( tooltipStateKey ) || {
				isTooltipVisible: false,
				rehideAdminMenu: false,
				rehideAdminSubMenu: false,
			}
	);
}
