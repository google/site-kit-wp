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
import { useEffect } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../datastore';
import { ACCOUNT_CREATE } from '../datastore/constants';
import SettingsForm from './settings-form';
import ProgressBar from '../../../components/progress-bar';
import {
	AccountCreate,
	ExistingTagError,
} from '../common';
const { useSelect, useDispatch } = Data;

export default function SettingsEdit() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() ) || {};
	const existingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasTagPermission( existingTag.propertyID, existingTag.accountID ) );
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const isFetchingAccounts = useSelect( ( select ) => select( STORE_NAME ).isFetchingAccounts() );
	const isDoingSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).isDoingSubmitChanges() );
	const isCreateAccount = ACCOUNT_CREATE === accountID;

	// Toggle disabled state of legacy confirm changes button.
	useEffect( () => {
		const confirm = global.document.getElementById( 'confirm-changes-analytics' );
		if ( confirm ) {
			confirm.disabled = ! canSubmitChanges;
		}
	}, [ canSubmitChanges ] );

	const { submitChanges } = useDispatch( STORE_NAME );
	useEffect( () => {
		addFilter(
			'googlekit.SettingsConfirmed',
			'googlekit.AnalyticsSettingsConfirmed',
			( chain, module ) => {
				if ( 'analytics-module' === module ) {
					return submitChanges();
				}
				return chain;
			}
		);

		return () => {
			removeFilter(
				'googlekit.SettingsConfirmed',
				'googlekit.AnalyticsSettingsConfirmed',
			);
		};
	} );

	const viewComponent = ( () => {
		switch ( true ) {
			case ( isFetchingAccounts || isDoingSubmitChanges ) :
				return <ProgressBar />;
			case ( hasExistingTag && existingTagPermission === false ) :
				return <ExistingTagError />;
			case ( ! accounts.length || isCreateAccount ) :
				return <AccountCreate />;
			default:
				return <SettingsForm />;
		}
	} )();

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			{ viewComponent }
		</div>
	);
}
