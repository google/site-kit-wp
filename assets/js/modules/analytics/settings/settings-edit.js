/**
 * Analytics Settings Edit component.
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
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../datastore';
import AccountCreate from '../common/account-create-legacy';
import SettingsForm from './settings-form';
import ExistingTagError from '../setup/existing-tag-error';

export default function SettingsEdit() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const isCreateAccount = useSelect( ( select ) => select( STORE_NAME ).isCreateAccount() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() ) || {};
	const existingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasTagPermission( existingTag.propertyID, existingTag.accountID ) );

	const settings = useSelect( ( select ) => select( STORE_NAME ).getSettings() );
	const haveSettingsChanged = useSelect( ( select ) => select( STORE_NAME ).haveSettingsChanged() );

	useEffect( () => {
		const confirm = global.document.getElementById( 'confirm-changes-analytics' );
		const forceDisable = ( hasExistingTag && existingTagPermission === false ) || ! accounts.length;
		if ( confirm ) {
			confirm.disabled = forceDisable || ! haveSettingsChanged;
		}
	}, [ settings, hasExistingTag, existingTagPermission, accounts ] );

	const ViewComponent = ( () => {
		switch ( true ) {
			case ( hasExistingTag && existingTagPermission === false ) :
				return ExistingTagError;
			case ( ! accounts.length || isCreateAccount ) :
				return AccountCreate;
			default:
				return SettingsForm;
		}
	} )();

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<ViewComponent />
		</div>
	);
}
