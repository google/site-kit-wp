/**
 * ModuleSettings component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect, useDispatch } = Data;
import Dialog from '../../../components/dialog';

const ModuleSettings = ( { provides, slug, children } ) => {
	const [ state, setState ] = useState( {
		isSaving: false,
		// setupComplete: props.setupComplete,
		dialogActive: false,
	} );

	const { setModuleActivation } = useDispatch( ( dispatch ) => dispatch( STORE_NAME ) );
	const module = useSelect( ( select ) => select( STORE_NAME ).getModule( slug ) );
	const modules = useSelect( ( select ) => select( STORE_NAME ).getModules() );
	const isEditing = useSelect( ( select ) => select( STORE_NAME ).isEditingSettings( slug ) );
	const { name } = module.settings;
	const { dependents } = module;

	const handleDialog = () => {
		setState(
			{
				...state,
				dialogActive: ! state.dialogActive,
			}
		);
	};

	const handleCloseModal = ( e ) => {
		if ( 27 === e.keyCode ) {
			setState( {
				...state,
				dialogActive: false,
			} );
		}
	};

	const handleConfirmRemoveModule = () => {
		// Deactivate module.
		setModuleActivation( slug, false );
	};

	// Find modules that depend on a module.
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

	// Register listener for closing modal with Esc.
	useEffect( () => {
		global.addEventListener( 'keyup', handleCloseModal, false );
		return () => {
			global.removeEventListener( 'keyup', handleCloseModal );
		};
	}, [] );

	/* translators: %s: module name */
	const subtitle = sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), name );
	const dependentModules = map( getDependentModules(), 'name' ).join( ', ' );
	const { dialogActive } = state;

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-module',
				'googlesitekit-settings-module--active',
				`googlesitekit-settings-module--${ slug }`,
				{ 'googlesitekit-settings-module--error': error && isEditing }
			) }
			key={ slug }
		>
			{ children }
			<Dialog
				dialogActive={ dialogActive }
				handleDialog={ handleDialog }
				/* translators: %s: module name */
				title={ sprintf( __( 'Disconnect %s from Site Kit?', 'google-site-kit' ), name ) }
				subtitle={ subtitle }
				onKeyPress={ handleCloseModal }
				provides={ provides }
				handleConfirm={ handleConfirmRemoveModule }
				dependentModules={ dependentModules
					? sprintf(
						/* translators: %s: module name */
						__( 'these active modules depend on %s and will also be disconnected: ', 'google-site-kit' ),
						name
					) + dependentModules : false
				}
				danger
			/>
		</div>
	);
};

ModuleSettings.propTypes = {
	provides: PropTypes.arrayOf( PropTypes.string ),
	slug: PropTypes.string.isRequired,
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.node ),
		PropTypes.node,
	] ).isRequired,
};

ModuleSettings.defaultProps = {
	provides: [],
};

export default ModuleSettings;
