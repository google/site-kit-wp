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
import { __, _x } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME, PROPERTY_CREATE, FORM_SETUP, ACCOUNT_CREATE } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4PropertySelect from '../../../analytics-4/components/common/PropertySelect';
import { AccountSelect, GA4PropertyNotice, ExistingTagNotice } from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupFormGA4() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];

	const ga4HasExistingTag = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).hasExistingTag() );
	const ga4ExistingTag = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getExistingTag() );
	const ga4MeasurementID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getMeasurementID() );
	const ga4PropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );

	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const { selectProperty } = useDispatch( STORE_NAME );
	const { setValues } = useDispatch( CORE_FORMS );
	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

	const shouldShowAssociatedPropertyNotice = accountID && accountID !== ACCOUNT_CREATE && ga4PropertyID;

	useMount( () => {
		selectProperty( PROPERTY_CREATE );
		setValues( FORM_SETUP, { profileName: _x( 'All Web Site Data', 'default Analytics view name', 'google-site-kit' ) } );
	} );

	useEffect( () => {
		if ( ga4HasExistingTag ) {
			setUseSnippet( ga4ExistingTag !== ga4MeasurementID );
		}
	}, [ setUseSnippet, ga4HasExistingTag, ga4ExistingTag, ga4MeasurementID ] );

	return (
		<Fragment>
			<StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } />
			<ExistingTagNotice />

			{ ( !! accounts.length ) && (
				<p className="googlesitekit-margin-bottom-0">
					{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />
				<GA4PropertySelect />
			</div>

			{ shouldShowAssociatedPropertyNotice && <GA4PropertyNotice
				notice={ __( 'An associated Universal Analytics property will also be created.', 'google-site-kit' ) }
			/> }
		</Fragment>
	);
}
