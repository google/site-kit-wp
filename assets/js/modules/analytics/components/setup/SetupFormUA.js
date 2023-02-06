/**
 * Analytics UA Setup form.
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
 * External dependencies
 */
import { useMount } from 'react-use';

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
	ProfileSelect,
	PropertySelect,
	ProfileNameTextField,
} from '../common';
import {
	MODULES_ANALYTICS,
	PROFILE_CREATE,
	ACCOUNT_CREATE,
} from '../../datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../../analytics-4/datastore/constants';
import GA4PropertyNotice from '../common/GA4PropertyNotice';
import SetupUseSnippetSwitchUA from './SetupUseSnippetSwitch';
import { SetupUseSnippetSwitch as SetupUseSnippetSwitchGA4 } from '../../../analytics-4/components/setup';

const { useSelect, useDispatch } = Data;

export default function SetupFormUA() {
	const { selectProperty } = useDispatch( MODULES_ANALYTICS_4 );
	const accounts =
		useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccounts() ) ||
		[];

	// Needed to conditionally show the profile name field and surrounding container.
	const profileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
	);

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const shouldShowGA4PropertyNotice =
		accountID && accountID !== ACCOUNT_CREATE && propertyID;

	const hasExistingGA4Tag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasExistingTag()
	);

	useMount( () => {
		selectProperty( PROPERTY_CREATE );
	} );

	return (
		<Fragment>
			{ !! accounts.length && (
				<p className="googlesitekit-margin-bottom-0">
					{ __(
						'Please select the account information below. You can change this later in your settings.',
						'google-site-kit'
					) }
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

			<SetupUseSnippetSwitchUA />

			{ shouldShowGA4PropertyNotice && (
				<GA4PropertyNotice
					notice={ __(
						'A Google Analytics 4 property will also be created.',
						'google-site-kit'
					) }
				>
					{ hasExistingGA4Tag && <SetupUseSnippetSwitchGA4 /> }
				</GA4PropertyNotice>
			) }
		</Fragment>
	);
}
