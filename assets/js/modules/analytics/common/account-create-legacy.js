/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../../components/button';
import Link from '../../../components/link';
import ProgressBar from '../../../components/progress-bar';
import { trackEvent } from '../../../util';
import { STORE_NAME } from '../datastore';
import { ACCOUNT_CREATE } from '../datastore/constants';

export default function AccountCreateLegacy() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const isFetchingAccounts = useSelect( ( select ) => select( STORE_NAME ).isFetchingAccounts() );
	const isCreateAccount = ACCOUNT_CREATE === accountID;

	const createAccountHandler = ( e ) => {
		e.preventDefault();
		trackEvent( 'analytics_setup', 'new_analytics_account' );
		global.open( 'https://analytics.google.com/analytics/web/?#/provision/SignUp', '_blank' );
	};

	const { resetAccounts } = useDispatch( STORE_NAME );
	const refetchAccountsHandler = useCallback( () => {
		resetAccounts();
	} );

	if ( isFetchingAccounts ) {
		return <ProgressBar />;
	}

	return (
		<div>
			{ ( ! isCreateAccount && ! accounts.length ) && (
				<p>
					{ __( 'Looks like you don\'t have an Analytics account yet. Once you create it, click on "Re-fetch my account" and Site Kit will locate it.', 'google-site-kit' ) }
				</p>
			) }

			{ isCreateAccount &&
				<Fragment>
					<p>{ __( 'To create a new account, click the button below which will open the Google Analytics account creation screen in a new window.', 'google-site-kit' ) }</p>
					<p>{ __( 'Once completed, click the link below to re-fetch your accounts to continue.', 'google-site-kit' ) }</p>
				</Fragment>
			}

			<div className="googlesitekit-setup-module__action">
				<Button onClick={ createAccountHandler }>
					{ __( 'Create an account', 'google-site-kit' ) }
				</Button>

				<div className="googlesitekit-setup-module__sub-action">
					<Link onClick={ refetchAccountsHandler }>
						{ __( 'Re-fetch My Account', 'google-site-kit' ) }
					</Link>
				</div>
			</div>
		</div>
	);
}
