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
import { clearWebStorage, getModulesData } from '../../util';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import Data from 'googlesitekit-data';
import Layout from '../layout/Layout';
import SettingsModule from './settings-module';
const { useDispatch, useSelect } = Data;

const SettingsActiveModules = ( { activeModule, moduleState, setModuleState } ) => {
	const { submitChanges } = useDispatch( CORE_MODULES );
	const [ error, setError ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const modulesData = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	const onEdit = useCallback( ( slug ) => {
		setModuleState( slug, 'edit' );
	}, [ setModuleState ] );

	const onCancel = useCallback( ( slug ) => {
		setModuleState( slug, 'view' );
	}, [ setModuleState ] );

	const onConfirm = useCallback( async ( slug ) => {
		setIsSaving( true );
		// to rename
		const { error: submissionError } = await submitChanges( slug );

		setIsSaving( false );

		if ( ! error ) {
			setModuleState( slug, 'view' );
			clearWebStorage();
		} else {
			setError( submissionError );
		}
	}, [ submitChanges, setModuleState, setError ] );

	const handleAccordion = useCallback( ( module, e ) => {
		// Set focus on heading when clicked.
		e.target.closest( '.googlesitekit-settings-module__header' ).focus();

		// If same as activeModule, toggle closed, otherwise it is open.
		const isOpen = module !== activeModule || moduleState === 'closed';

		setModuleState(
			module,
			isOpen ? 'view' : 'closed',
		);
	}, [ setModuleState, activeModule ] );

	if ( ! modulesData ) {
		return null;
	}

	// deprecated
	const deprecatedModulesData = getModulesData();

	const modules = Object.values( modulesData )
		.filter( ( module ) => ! module.internal && module.active )
		.sort( ( module1, module2 ) => module1.sort - module2.sort );

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-12
		">
			<Layout>
				{ modules.map( ( module ) => {
					return (
						<SettingsModule
							key={ module.slug + '-module' }
							slug={ module.slug }
							name={ module.name }
							description={ module.description }
							homepage={ module.homepage }
							learnmore={ deprecatedModulesData[ module.slug ]?.learnMore }
							active={ module.active }
							setupComplete={ module.active && module.connected }
							autoActivate={ deprecatedModulesData[ module.slug ]?.autoActivate }
							handleEdit={ onEdit }
							handleConfirm={ onConfirm }
							handleCancel={ onCancel }
							isEditing={ { [ `${ activeModule }-module` ]: moduleState === 'edit' } }
							isOpen={ activeModule === module.slug && moduleState !== 'closed' }
							handleAccordion={ handleAccordion }
							provides={ deprecatedModulesData[ module.slug ]?.provides }
							isSaving={ isSaving }
							error={ error }
						/>
					);
				} ) }
			</Layout>
		</div>
	);
};

export default SettingsActiveModules;
