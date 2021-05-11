
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	AccountSelect,
	ExistingGTMPropertyNotice,
	ExistingTagNotice,
	ProfileSelect,
	PropertySelect,
	ProfileNameTextField,
} from '../common';
import { STORE_NAME, PROFILE_CREATE } from '../../datastore/constants';
import GA4Notice from '../common/GA4Notice';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';

const { useSelect } = Data;

export default function SetupFormLegacy( { } ) {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );

	// Needed to conditionally show the profile name field and surrounding container.
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );

	return (
		<Fragment>
			<GA4Notice />
			<StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } />
			<ExistingTagNotice />
			{ ! hasExistingTag && <ExistingGTMPropertyNotice /> }

			{ ( !! accounts.length && ! hasExistingTag ) && (
				<p className="googlesitekit-margin-bottom-0">
					{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelect />

				<ProfileSelect />
			</div>

			{ profileID === PROFILE_CREATE && (
				<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
					<ProfileNameTextField />
				</div>
			) }
		</Fragment>
	);
}
