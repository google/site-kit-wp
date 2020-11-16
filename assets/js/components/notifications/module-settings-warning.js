/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import classnames from 'classnames';
import ErrorIcon from '../../../svg/error.svg';

const { useSelect } = Data;

/*
 * A single module. Keeps track of its own active state and settings.
 */
export default function ModuleSettingsWarning( { slug } ) {
	const error = useSelect( ( select ) => select( CORE_MODULES )?.getCheckRequirementsStatus( slug ) );

	if ( ! error ) {
		return null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-settings-module-warning', 'googlesitekit-settings-module-warning--modules-list' ) } >
			<ErrorIcon height="20" width="23" /> { error.message }
		</div>
	);
}
