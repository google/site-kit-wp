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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SettingsEdit from './SettingsEdit';
import SettingsView from './SettingsView';
import { STORE_NAME } from '../../datastore/constants';
const { useSelect, useDispatch } = Data;

export default function SettingsMain( { isOpen, isEditing } ) {
	const isDoingSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).isDoingSubmitChanges() );
	const haveSettingsChanged = useSelect( ( select ) => select( STORE_NAME ).haveSettingsChanged() );
	// Rollback any temporary selections to saved values if settings have changed and no longer editing.
	const { rollbackSettings } = useDispatch( STORE_NAME );
	useEffect( () => {
		if ( haveSettingsChanged && ! isDoingSubmitChanges && ! isEditing ) {
			rollbackSettings();
		}
	}, [ haveSettingsChanged, isDoingSubmitChanges, isEditing ] );

	if ( ! isOpen ) {
		return null;
	}

	if ( isEditing ) {
		return <SettingsEdit />;
	}

	return <SettingsView />;
}
