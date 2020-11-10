/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import classnames from 'classnames';
import ErrorIcon from '../../../svg/error.svg';

const { useSelect } = Data;

/**
 * A single module. Keeps track of its own active state and settings.
 */
/*
class ModuleSettingsWarning extends Component {
	render() {
		return null;
	}
}

export default withFilters( 'googlesitekit.ModuleSettingsWarning' )( ModuleSettingsWarning );
*/

export default function ModuleSettingsWarning( {
	slug,
	// context,
} ) {
	// @TODO: Resolver only runs once per set of args, so we are working around
	// this to rerun after modules are loaded.
	// Once #1769 is resolved, we can remove the call to getModules,
	// and remove the !! modules cache busting param.
	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );
	const canActivateModule = useSelect( ( select ) => select( CORE_MODULES ).canActivateModule( slug, !! modules ) );
	const requirementsStatus = useSelect( ( select ) => select( CORE_MODULES ).getCheckRequirementsStatus( slug, !! modules ) );
	const errorMessage = canActivateModule ? null : requirementsStatus;

	return errorMessage
		? (
			<div
				className={ classnames( 'googlesitekit-settings-module-warning', 'googlesitekit-settings-module-warning--modules-list' ) } >
				<ErrorIcon height="20" width="23" /> { errorMessage }
			</div>
		) : null;
}

