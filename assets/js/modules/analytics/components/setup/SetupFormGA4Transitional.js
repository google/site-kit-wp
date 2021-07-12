/**
 * Analytics GA4Transitional Setup form.
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
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { STORE_NAME, PROFILE_CREATE, PROPERTY_TYPE_UA, PROPERTY_TYPE_GA4, ACCOUNT_CREATE } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4PropertySelect from '../../../analytics-4/components/common/PropertySelect';
import {
	AccountSelect,
	ProfileSelect,
	PropertySelect,
	PropertySelectIncludingGA4,
	ProfileNameTextField,
	GA4PropertyNotice,
	ExistingTagNotice,
} from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupFormGA4Transitional() {
	const accounts = useSelect( ( select ) => select( STORE_NAME ).getAccounts() ) || [];
	const propertyType = useSelect( ( select ) => select( STORE_NAME ).getPrimaryPropertyType() );

	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );

	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );

	const ga4PropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );
	const ga4ExistingTag = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getExistingTag() );
	const ga4MeasurementID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getMeasurementID() );

	const { setUseSnippet: uaSetUseSnippet } = useDispatch( STORE_NAME );
	const { setUseSnippet: ga4SetUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

	const shouldShowAssociatedPropertyNotice = accountID && accountID !== ACCOUNT_CREATE && ( propertyID || ga4PropertyID );

	useEffect( () => {
		uaSetUseSnippet( existingTag !== propertyID );
		ga4SetUseSnippet( ga4ExistingTag !== ga4MeasurementID );
	}, [
		uaSetUseSnippet,
		existingTag,
		propertyID,
		ga4SetUseSnippet,
		ga4ExistingTag,
		ga4MeasurementID,
	] );

	const notice = propertyType === PROPERTY_TYPE_UA
		? __( 'You need to connect the Google Analytics 4 property that’s associated with this Universal Analytics property.', 'google-site-kit' )
		: __( 'You need to connect the Universal Analytics property that’s associated with this Google Analytics 4 property.', 'google-site-kit' );

	return (
		<Fragment>
			<StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } />
			<ExistingTagNotice />

			{ ( !! accounts.length && ! hasExistingTag ) && (
				<p className="googlesitekit-margin-bottom-0">
					{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelectIncludingGA4 />

				{ propertyType === PROPERTY_TYPE_UA && (
					<ProfileSelect />
				) }
			</div>

			{ ( profileID === PROFILE_CREATE && propertyType === PROPERTY_TYPE_UA ) && (
				<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
					<ProfileNameTextField />
				</div>
			) }

			{ shouldShowAssociatedPropertyNotice && <GA4PropertyNotice notice={ notice }>
				{ propertyType === PROPERTY_TYPE_GA4 && (
					<Fragment>
						<div className="googlesitekit-setup-module__inputs">
							<PropertySelect />
							<ProfileSelect />
						</div>

						{ profileID === PROFILE_CREATE && (
							<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
								<ProfileNameTextField />
							</div>
						) }
					</Fragment>
				) }
				{ propertyType === PROPERTY_TYPE_UA && (
					<div className="googlesitekit-setup-module__inputs">
						<GA4PropertySelect />
					</div>
				) }
			</GA4PropertyNotice> }
		</Fragment>
	);
}
