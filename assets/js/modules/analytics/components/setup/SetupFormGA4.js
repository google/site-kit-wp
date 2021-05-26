/**
 * Analytics GA4 Setup form.
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
import { STORE_NAME, PROPERTY_CREATE } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import SettingsNotice, { TYPE_INFO } from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';
import PropertySelect from '../../../analytics-4/components/common/PropertySelect';
import AccountSelect from '../common/AccountSelect';
const { useSelect, useDispatch } = Data;

export default function SetupFormGA4() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];

	const { selectProperty } = useDispatch( STORE_NAME );
	useMount( () => {
		selectProperty( PROPERTY_CREATE );
	} );

	return (
		<Fragment>
			<StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } />

			{ ( !! accounts.length ) && (
				<p className="googlesitekit-margin-bottom-0">
					{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />
				<PropertySelect />
			</div>

			<SettingsNotice type={ TYPE_INFO }>
				{ __( 'An associated Universal Analytics property will also be created.', 'google-site-kit' ) }
				<Link href={ '#' }>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</SettingsNotice>
		</Fragment>
	);
}
