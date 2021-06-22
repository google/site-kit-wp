/**
 * Analytics Legacy Setup form.
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
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, PROFILE_CREATE } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import {
	AccountSelect,
	ExistingGTMPropertyNotice,
	ExistingTagNotice,
	ProfileSelect,
	PropertySelect,
	ProfileNameTextField,
	GA4Notice,
} from '../common';
const { useSelect } = Data;

export default function SetupFormLegacy() {
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
