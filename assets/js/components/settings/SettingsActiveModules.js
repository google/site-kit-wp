/**
 * SettingsActiveModules component.
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
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { clearWebStorage } from '../../util';
import Layout from '../layout/Layout';
import SettingsActiveModule from './SettingsActiveModule';
const { useDispatch, useSelect } = Data;

export default function SettingsActiveModules( { activeModule, moduleState, setModuleState } ) {
	const [ error, setError ] = useState( undefined );
	const [ isSaving, setIsSaving ] = useState( false );

	const { submitChanges } = useDispatch( CORE_MODULES );
	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	const onEdit = useCallback( ( slug ) => {
		setModuleState( slug, 'edit' );
	}, [ setModuleState ] );

	const onCancel = useCallback( ( slug ) => {
		setModuleState( slug, 'view' );
	}, [ setModuleState ] );

	const onConfirm = useCallback( async ( slug ) => {
		setIsSaving( true );
		const { error: submissionError } = await submitChanges( slug );
		setIsSaving( false );

		if ( submissionError ) {
			setError( submissionError );
		} else {
			setModuleState( slug, 'view' );
			clearWebStorage();
		}
	}, [ setModuleState ] );

	const onToggle = useCallback( ( slug, e ) => {
		// Set focus on heading when clicked.
		e.target.closest( '.googlesitekit-settings-module__header' ).focus();

		// If same as activeModule, toggle closed, otherwise it is open.
		const isOpen = slug !== activeModule || moduleState === 'closed';
		setModuleState( slug, isOpen ? 'view' : 'closed' );
	}, [ activeModule, moduleState, setModuleState ] );

	if ( ! modules ) {
		return null;
	}

	const sortedModules = Object.values( modules )
		.filter( ( module ) => ! module.internal && module.active )
		.sort( ( a, b ) => a.order - b.order );

	return (
		<Layout>
			{ sortedModules.map( ( { slug } ) => (
				<SettingsActiveModule
					key={ slug }
					slug={ slug }
					onEdit={ onEdit }
					onConfirm={ onConfirm }
					onCancel={ onCancel }
					onToggle={ onToggle }
					isOpen={ activeModule === slug && moduleState !== 'closed' }
					isEditing={ activeModule === slug && moduleState === 'edit' }
					isLocked={ activeModule !== slug && moduleState === 'edit' }
					isSaving={ isSaving }
					error={ error }
				/>
			) ) }
		</Layout>
	);
}

SettingsActiveModules.propTypes = {
	activeModule: PropTypes.string,
	moduleState: PropTypes.string,
	setModuleState: PropTypes.func.isRequired,
};
