/**
 * Tag Manager Account Create component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { trackEvent } from '../../../../util/tracking';
import useViewContext from '../../../../hooks/useViewContext';

export default function AccountCreate() {
	const viewContext = useViewContext();

	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).hasFinishedResolution( 'getAccounts' )
	);
	const hasResolvedGetUser = useSelect( ( select ) =>
		select( CORE_USER ).hasFinishedResolution( 'getUser' )
	);
	const createAccountURL = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getServiceURL( {
			path: 'admin/accounts/create',
		} )
	);

	const { resetAccounts } = useDispatch( MODULES_TAGMANAGER );
	const refetchAccountsHandler = useCallback( () => {
		resetAccounts();
	}, [ resetAccounts ] );

	const createAccountHandler = useCallback( () => {
		trackEvent( `${ viewContext }_tagmanager`, 'create_account' );

		// Need to use window.open for this to allow for stubbing in E2E.
		global.window.open( createAccountURL, '_blank' );
	}, [ createAccountURL, viewContext ] );

	if ( ! hasResolvedAccounts || ! hasResolvedGetUser ) {
		return <ProgressBar />;
	}

	return (
		<div>
			<StoreErrorNotices
				moduleSlug="tagmanager"
				storeName={ MODULES_TAGMANAGER }
			/>

			<p>
				{ __(
					'To create a new account, click the button below which will open the Google Tag Manager account creation screen in a new window.',
					'google-site-kit'
				) }
			</p>
			<p>
				{ __(
					'Once completed, click the link below to re-fetch your accounts to continue.',
					'google-site-kit'
				) }
			</p>

			<div className="googlesitekit-setup-module__action">
				<Button onClick={ createAccountHandler }>
					{ __( 'Create an account', 'google-site-kit' ) }
				</Button>

				<div className="googlesitekit-setup-module__sub-action">
					<Button tertiary onClick={ refetchAccountsHandler }>
						{ __( 'Re-fetch My Account', 'google-site-kit' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}
