/**
 * Legacy Account Creation component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import { trackEvent } from '../../../../util';
import { MODULES_ANALYTICS_4, ACCOUNT_CREATE } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Notice from './Notice';
import useViewContext from '../../../../hooks/useViewContext';

export default function AccountCreateLegacy() {
	const accounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountSummaries()
	);
	const hasResolvedAccounts = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
			'getAccountSummaries'
		)
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);
	const isCreateAccount = ACCOUNT_CREATE === accountID;
	const createAccountURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getServiceURL( {
			path: '/provision/SignUp',
		} )
	);
	const viewContext = useViewContext();

	const createAccountHandler = useCallback(
		async ( event ) => {
			event.preventDefault();
			await trackEvent(
				`${ viewContext }_analytics`,
				'create_account',
				'custom-oauth'
			);
			global.open( createAccountURL, '_blank' );
		},
		[ createAccountURL, viewContext ]
	);

	const { resetAccountSummaries, resetAccountSettings } =
		useDispatch( MODULES_ANALYTICS_4 );
	const refetchAccountsHandler = useCallback( () => {
		resetAccountSummaries();
		resetAccountSettings();
	}, [ resetAccountSettings, resetAccountSummaries ] );

	if ( ! hasResolvedAccounts ) {
		return <ProgressBar />;
	}

	return (
		<div>
			<Notice />
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			{ ! isCreateAccount && accounts && accounts.length === 0 && (
				<p>
					{ __(
						'Looks like you don’t have an Analytics account yet. Once you create it, click on "Re-fetch my account" and Site Kit will locate it.',
						'google-site-kit'
					) }
				</p>
			) }

			{ isCreateAccount && (
				<Fragment>
					<p>
						{ __(
							'To create a new account, click the button below which will open the Google Analytics account creation screen in a new window.',
							'google-site-kit'
						) }
					</p>
					<p>
						{ __(
							'Once completed, click the link below to re-fetch your accounts to continue.',
							'google-site-kit'
						) }
					</p>
				</Fragment>
			) }

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
