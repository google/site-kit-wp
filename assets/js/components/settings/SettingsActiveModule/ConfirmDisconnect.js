/**
 * ConfirmDisconnect component for SettingsActiveModule.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import Dialog from '../../Dialog';
const { useSelect } = Data;

export default function ConfirmDisconnect( { slug, handleDialog, handleConfirmRemoveModule } ) {
	const dependentModules = useSelect( ( select ) => select( CORE_MODULES ).getModuleDependantNames( slug ) );
	const provides = useSelect( ( select ) => select( CORE_MODULES ).getModuleFeatures( slug ) );
	const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( slug ) );

	useEffect( () => {
		const onKeyPress = ( e ) => {
			if ( ESCAPE === e.keyCode ) {
				handleDialog();
			}
		};

		global.addEventListener( 'keydown', onKeyPress );
		return () => {
			global.removeEventListener( 'keydown', onKeyPress );
		};
	}, [] );

	if ( ! module ) {
		return null;
	}

	const { name } = module;

	const title = sprintf(
		/* translators: %s: module name */
		__( 'Disconnect %s from Site Kit?', 'google-site-kit' ),
		name,
	);

	const subtitle = sprintf(
		/* translators: %s: module name */
		__( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ),
		name,
	);

	let dependentModulesText = null;
	if ( dependentModules.length > 0 ) {
		dependentModulesText = sprintf(
			/* translators: %1$s: module name, %2$s: list of dependent modules */
			__( 'these active modules depend on %1$s and will also be disconnected: %2$s', 'google-site-kit' ),
			name,
			dependentModules,
		);
	}

	return (
		<Dialog
			dialogActive
			handleDialog={ handleDialog }
			title={ title }
			subtitle={ subtitle }
			provides={ provides }
			handleConfirm={ handleConfirmRemoveModule }
			dependentModules={ dependentModulesText }
			danger
		/>
	);
}

ConfirmDisconnect.propTypes = {
	slug: PropTypes.string.isRequired,
	handleDialog: PropTypes.func.isRequired,
	handleConfirmRemoveModule: PropTypes.func.isRequired,
};
