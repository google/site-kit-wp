import { useSelect } from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';

export function useTooltipState() {
	return useSelect(
		( select ) =>
			select( CORE_UI ).getValue( 'admin-menu-tooltip' ) || {
				isTooltipVisible: false,
				rehideAdminMenu: false,
				rehideAdminSubMenu: false,
			}
	);
}
