/**
 * Tag Manager Setup Form component.
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
import { useEffect, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../../components/button';
import { STORE_NAME, FORM_SETUP, EDIT_SCOPE } from '../../datastore/constants';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { isPermissionScopeError } from '../../../../googlesitekit/datastore/user/utils/is-permission-scope-error';
import { ErrorNotice, ExistingTagNotice, AMPContainerSelect, WebContainerSelect, AccountSelect } from '../common';
import { __ } from '@wordpress/i18n';
const { useSelect, useDispatch } = Data;

export default function SetupForm( { finishSetup } ) {
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const canSubmitChanges = useSelect( ( select ) => select( STORE_NAME ).canSubmitChanges() );
	const isSecondaryAMP = useSelect( ( select ) => select( CORE_SITE ).isSecondaryAMP() );
	const hasEditScope = useSelect( ( select ) => select( CORE_USER ).hasScope( EDIT_SCOPE ) );
	const autoSubmit = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_SETUP, 'autoSubmit' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const { submitChanges } = useDispatch( STORE_NAME );
	const submitForm = useCallback( async ( event ) => {
		event.preventDefault();
		const { error } = await submitChanges();
		if ( isPermissionScopeError( error ) ) {
			setValues( FORM_SETUP, { autoSubmit: true } );
		}
		if ( ! error ) {
			setValues( FORM_SETUP, { autoSubmit: false } );
			finishSetup();
		}
	}, [ canSubmitChanges, finishSetup ] );

	// If the user lands back on this component with autoSubmit and the edit scope,
	// resubmit the form.
	useEffect( () => {
		if ( autoSubmit && hasEditScope ) {
			submitForm( { preventDefault: () => {} } );
		}
	}, [ hasEditScope, autoSubmit, submitForm ] );

	return (
		<form
			className="googlesitekit-tagmanager-setup__form"
			onSubmit={ submitForm }
		>
			<ErrorNotice />

			<ExistingTagNotice />

			{ ( ! hasExistingTag && ! isSecondaryAMP ) && (
				<p>
					{ __( 'Please select your Tag Manager account and container below, the snippet will be inserted automatically on your site.', 'google-site-kit' ) }
				</p>
			) }

			{ ( ! hasExistingTag && isSecondaryAMP ) && (
				<p>
					{ __( 'Looks like your site is using paired AMP. Please select your Tag Manager account and relevant containers below, the snippets will be inserted automatically on your site.', 'google-site-kit' ) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<AMPContainerSelect />

				<WebContainerSelect />
			</div>

			<div className="googlesitekit-setup-module__action">
				<Button disabled={ ! canSubmitChanges }>
					{ __( 'Confirm & Continue', 'google-site-kit' ) }
				</Button>
			</div>
		</form>
	);
}
