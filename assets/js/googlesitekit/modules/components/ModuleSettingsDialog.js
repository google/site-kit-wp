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

/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;
import Dialog from '../../../components/dialog';

function ModuleSettingsDialog( { provides, slug, toggleDialogState, onRemove } ) {
	const module = useSelect( ( select ) => select( STORE_NAME ).getModule( slug ) );
	const modules = useSelect( ( select ) => select( STORE_NAME ).getModules() );

	const {
		name: moduleName,
		dependants: moduleDependents = [],
	} = module || {};

	const handleCloseModal = useCallback( ( event ) => {
		if ( ESCAPE === event.keyCode ) {
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

	if ( ! module || ! Array.isArray( modules ) ) {
		return null;
	}

	const dependentActiveModules = moduleDependents
		// Map module slugs into module objects.
		.map( ( dependentSlug ) => modules[ dependentSlug ] )
		// Filter out inactive modules and bad references.
		.filter( ( dependentModule ) => dependentModule?.active )
		// Pluck the module names.
		.map( ( { name } ) => name );

	return (
		<Dialog
			title={
			/* translators: %s: module name */
				sprintf( __( 'Disconnect %s from Site Kit?', 'google-site-kit' ), moduleName )
			}
			subtitle={
			/* translators: %s: module name */
				sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), moduleName )
			}
			dependentModules={
				dependentActiveModules.length > 0 && sprintf(
					/* translators: 1: module name, 2: module names */
					__( 'these active modules depend on %1$s and will also be disconnected: %2$s', 'google-site-kit' ),
					moduleName,
					dependentActiveModules.join(
						/* translators: used between list items, there is a space after the comma. */
						__( ', ', 'google-site-kit' )
					)
				)
			}
			provides={ provides }
			handleDialog={ toggleDialogState }
			handleConfirm={ onRemove }
			onKeyPress={ handleCloseModal }
			dialogActive
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
