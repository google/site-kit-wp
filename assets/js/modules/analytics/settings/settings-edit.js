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
import { STORE_NAME, ACCOUNT_CREATE } from '../datastore/constants';
import SettingsForm from './settings-form';
import ProgressBar from '../../../components/progress-bar';
import {
	AccountCreate,
	ErrorNotice,
	ExistingTagError,
} from '../common';
import { parsePropertyID } from '../util';
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
	const haveSettingsChanged = useSelect( ( select ) => select( STORE_NAME ).haveSettingsChanged() );
	const isCreateAccount = ACCOUNT_CREATE === accountID;

	// Rollback any temporary selections to saved values on dismount.
	// This is a bit of a hacky solution, as we'd prefer to rollback changes
	// when the "cancel" button is clicked. But we don't yet have control over
	// that section of the page, so if the component is unmounted, has changes,
	// and is not submitting those changes: we rollback.
	//
	// Technically this means we rollback right before we receive new settings
	// when they ARE saved, because the component is unmounted then and meets the
	// `haveSettingsChanged && ! isDoingSubmitChanges` criteria below.
	// But that's fine as the new settings are then immediately loaded into state
	// and there aren't any visual glitches. 🤷🏻‍♂️
	const { rollbackSettings } = useDispatch( STORE_NAME );
	useEffect( () => {
		return () => {
			if ( haveSettingsChanged && ! isDoingSubmitChanges ) {
				rollbackSettings();
			}
		};
	}, [ haveSettingsChanged, isDoingSubmitChanges ] );

	// Set the accountID and property if there is an existing tag.
	// This only applies to the edit view, so we apply it here rather than in the datastore.
	// These selections will be rolled back by the above hook if the user exits the edit view.
	const { setAccountID, selectProperty } = useDispatch( STORE_NAME );
	useEffect( () => {
		if ( hasExistingTag ) {
			const { accountID: existingTagAccountID } = parsePropertyID( existingTag );
			setAccountID( existingTagAccountID );
			selectProperty( existingTag );
		}
	}, [ hasExistingTag, existingTag ] );

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
			async ( chain, module ) => {
				if ( 'analytics-module' === module ) {
					const { error } = await submitChanges() || {};
					if ( error ) {
						return Promise.reject( error );
					}
					return Promise.resolve();
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
	}, [] );

	let viewComponent;
	if ( isFetchingAccounts || isDoingSubmitChanges ) {
		viewComponent = <ProgressBar />;
	} else if ( hasExistingTag && existingTagPermission === false ) {
		viewComponent = <ExistingTagError />;
	} else if ( ! accounts.length || isCreateAccount ) {
		viewComponent = <AccountCreate />;
	} else {
		viewComponent = <SettingsForm />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<ErrorNotice />

			{ viewComponent }
		</div>
	);
}
