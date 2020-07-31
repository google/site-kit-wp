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

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore/constants';
const { useSelect } = Data;
import Dialog from '../../../components/dialog';

const ModuleSettings = ( { slug, children } ) => {
	const [ state, setState ] = useState( {
		isSaving: false,
		// setupComplete: props.setupComplete,
		dialogActive: false,
	} );

	const module = useSelect( ( select ) => select( STORE_NAME ).getModule( slug ) );
	const isEditing = useSelect( ( select ) => select( STORE_NAME ).isEditingSettings( slug ) );
	const isOpen = useSelect( ( select ) => select( STORE_NAME ).isSettingsOpen( slug ) );
	const { connected, name } = module.settings;

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

	// Handle user click on the confirm removal button.
	const handleConfirmRemoveModule = () => {
		useSelect( ( select ) => dispatch( STORE_NAME ).setModuleActivation( slug, false ) );
	};

	useEffect( () => {
		global.addEventListener( 'keyup', handleCloseModal, false );
		return () => {
			global.removeEventListener( 'keyup', handleCloseModal );
		};
	}, [] );

	return (
		<div
			className={ classnames(
				'googlesitekit-settings-module',
				'googlesitekit-settings-module--active',
				`googlesitekit-settings-module--${ slug }`,
				{ 'googlesitekit-settings-module--error': error && editActive && isEditing }
			) }
			key={ slug }
		>
			{ children }
		</div>
	);
};

ModuleSettings.propTypes = {
	slug: PropTypes.string.isRequired,
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( PropTypes.node ),
		PropTypes.node,
	] ).isRequired,
};

export default ModuleSettings;
