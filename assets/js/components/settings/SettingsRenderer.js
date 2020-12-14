/**
 * Settings Renderer component.
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
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect, useDispatch } = Data;

export default function SettingsRenderer( { slug, isOpen, isEditing } ) {
	const storeName = `modules/${ slug }`;
	const isDoingSubmitChanges = useSelect( ( select ) => select( storeName )?.isDoingSubmitChanges?.() );
	const haveSettingsChanged = useSelect( ( select ) => select( storeName )?.haveSettingsChanged?.() );
	const { SettingsEditComponent, SettingsViewComponent } = useSelect( ( select ) => select( CORE_MODULES ).getModule( slug ) || {} );

	// Rollback any temporary selections to saved values if settings have changed and no longer editing.
	const { rollbackSettings } = useDispatch( storeName ) || {};
	useEffect( () => {
		if ( rollbackSettings && haveSettingsChanged && ! isDoingSubmitChanges && ! isEditing ) {
			rollbackSettings();
		}
	}, [ rollbackSettings, haveSettingsChanged, isDoingSubmitChanges, isEditing ] );

	if ( ! isOpen ) {
		return null;
	}

	if ( isEditing && SettingsEditComponent ) {
		return <SettingsEditComponent />;
	} else if ( ! isEditing && SettingsViewComponent ) {
		return <SettingsViewComponent />;
	}

	return null;
}
