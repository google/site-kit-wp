/**
 * Analytics Main Settings component.
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
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { DefaultModuleSettings } from '../../../../googlesitekit/modules/components';
import SettingsEdit from './SettingsEdit';
import SettingsView from './SettingsView';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
const { useSelect, useDispatch } = Data;

export default function SettingsMain() {
	const {
		canSubmitChanges,
		isDoingSubmitChanges,
		haveSettingsChanged,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			canSubmitChanges: store.canSubmitChanges(),
			isDoingSubmitChanges: store.isDoingSubmitChanges(),
			haveSettingsChanged: store.haveSettingsChanged(),
		};
	} );

	const isEditing = useSelect( ( select ) => select( CORE_MODULES ).isSettingsViewEditing( 'analytics' ) );
	const { submitChanges, rollbackSettings } = useDispatch( STORE_NAME );

	// Rollback any temporary selections to saved values if settings have changed and no longer editing.
	useEffect( () => {
		if ( haveSettingsChanged && ! isDoingSubmitChanges && ! isEditing ) {
			rollbackSettings();
		}
	}, [ haveSettingsChanged, isDoingSubmitChanges, isEditing ] );

	return (
		<DefaultModuleSettings
			slug={ 'analytics' }
			onEdit={ () => <SettingsEdit /> }
			onView={ () => <SettingsView /> }
			onSave={ submitChanges }
			canSave={ canSubmitChanges }
			provides={ [
				__( 'Audience overview', 'google-site-kit' ),
				__( 'Top pages', 'google-site-kit' ),
				__( 'Top acquisition channels', 'google-site-kit' ),
			] }
		/>
	);
}
