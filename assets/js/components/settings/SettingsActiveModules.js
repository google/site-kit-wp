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
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { clearWebStorage } from '../../util';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Data from 'googlesitekit-data';
import Layout from '../layout/Layout';
import SettingsModule from './settings-module';
import { Cell } from '../../material-components';
const { useDispatch, useSelect } = Data;

const SettingsActiveModules = ( { activeModule, moduleState, setModuleState } ) => {
	const { submitChanges } = useDispatch( CORE_MODULES );
	const [ error, setError ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const modulesData = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	const onEdit = useCallback( ( slug ) => {
		setModuleState( slug, 'edit' );
	}, [] );

	const onCancel = useCallback( ( slug ) => {
		setModuleState( slug, 'view' );
	}, [] );

	const onConfirm = useCallback( async ( slug ) => {
		setIsSaving( true );

		const { error: submissionError } = await submitChanges( slug );

		setIsSaving( false );

		if ( ! submissionError ) {
			setModuleState( slug, 'view' );
			clearWebStorage();
		} else {
			setError( submissionError );
		}
	}, [] );

	const handleAccordion = useCallback( ( module, e ) => {
		// Set focus on heading when clicked.
		e.target.closest( '.googlesitekit-settings-module__header' ).focus();

		// If same as activeModule, toggle closed, otherwise it is open.
		const isOpen = module !== activeModule || moduleState === 'closed';

		setModuleState(
			module,
			isOpen ? 'view' : 'closed',
		);
	}, [ activeModule ] );

	if ( ! modulesData ) {
		return null;
	}

	const modules = Object.values( modulesData )
		.filter( ( module ) => ! module.internal && module.active )
		.sort( ( module1, module2 ) => module1.sort - module2.sort );

	return (
		<Cell size={ 12 }>
			<Layout>
				{ modules.map( ( module ) => (
					<SettingsModule
						key={ module.slug + '-module' }
						slug={ module.slug }
						name={ module.name }
						description={ module.description }
						homepage={ module.homepage }
						active={ module.active }
						setupComplete={ module.active && module.connected }
						onEdit={ onEdit }
						onConfirm={ onConfirm }
						onCancel={ onCancel }
						isEditing={ { [ `${ activeModule }-module` ]: moduleState === 'edit' } }
						isOpen={ activeModule === module.slug && moduleState !== 'closed' }
						handleAccordion={ handleAccordion }
						isSaving={ isSaving }
						provides={ module.features }
						error={ error }
						autoActivate={ module.forceActive }
					/>
				) ) }
			</Layout>
		</Cell>
	);
};

export default SettingsActiveModules;
