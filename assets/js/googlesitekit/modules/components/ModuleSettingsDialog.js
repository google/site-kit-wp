/**
 * ModuleSettingsDialog component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;
import Dialog from '../../../components/dialog';

function ModuleSettingsDialog( { provides, slug, toggleDialogState, onRemove } ) {
	const {
		module,
		modules,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			module: store.getModule( slug ),
			modules: store.getModules(),
		};
	} );

	const handleCloseModal = useCallback( ( e ) => {
		if ( 27 === e.keyCode ) {
			toggleDialogState();
		}
	}, [] );

	// Register listener for closing modal with Esc.
	useEffect( () => {
		global.addEventListener( 'keyup', handleCloseModal, false );
		return () => {
			global.removeEventListener( 'keyup', handleCloseModal );
		};
	}, [] );

	// Find modules that depend on a module.
	const { name, dependants: dependents } = module;
	const getDependentModules = () => {
		const dependentModules = {};

		if ( dependents ) {
			dependents.forEach( ( dependentSlug ) => {
				if ( modules[ dependentSlug ] ) {
					dependentModules[ dependentSlug ] = modules[ dependentSlug ];
				}
			} );
		}

		return dependentModules;
	};

	/* translators: %s: module name */
	const subtitle = sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), name );
	const dependentModules = map( getDependentModules(), 'name' ).join( ', ' );

	return (
		<Dialog
			dialogActive
			handleDialog={ toggleDialogState }
			/* translators: %s: module name */
			title={ sprintf( __( 'Disconnect %s from Site Kit?', 'google-site-kit' ), name ) }
			subtitle={ subtitle }
			onKeyPress={ handleCloseModal }
			provides={ provides }
			handleConfirm={ onRemove }
			dependentModules={ dependentModules
				? sprintf(
					/* translators: %s: module name */
					__( 'these active modules depend on %s and will also be disconnected: ', 'google-site-kit' ),
					name
				) + dependentModules : false
			}
			danger
		/>
	);
}

ModuleSettingsDialog.propTypes = {
	slug: PropTypes.string.isRequired,
	provides: PropTypes.arrayOf( PropTypes.string ),
	toggleDialogState: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
};

ModuleSettingsDialog.defaultProps = {
	provides: [],
};

export default ModuleSettingsDialog;
