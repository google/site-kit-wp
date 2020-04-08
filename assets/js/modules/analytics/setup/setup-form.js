/**
 * Analytics Setup form.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../components/button';
import { STORE_NAME } from '../datastore';
import {
	AccountSelect,
	ExistingTagNotice,
	ProfileSelect,
	PropertySelect,
} from '../common/';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );

	const { submitChanges } = useDispatch( STORE_NAME );
	const submitForm = useCallback( async ( e ) => {
		e.preventDefault();
		const { error } = await submitChanges() || {};
		if ( ! error ) {
			finishSetup();
		}
	}, [ canSubmitChanges, finishSetup ] );

	return (
		<form
			className="googlesitekit-analytics-setup__form"
			onSubmit={ submitForm }
		>
			{ ( !! accounts.length && ! hasExistingTag ) && (
				<p>
					{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }
				</p>
			) }

			<ExistingTagNotice />

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelect />

				<ProfileSelect />
			</div>

			<div className="googlesitekit-setup-module__action">
				<Button disabled={ ! canSubmitChanges }>
					{ __( 'Configure Analytics', 'google-site-kit' ) }
				</Button>
			</div>
		</form>
	);
}
