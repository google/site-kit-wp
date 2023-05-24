/**
 * Analytics GA4 Setup form (legacy version, supports UA setup).
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	MODULES_ANALYTICS,
	PROPERTY_CREATE,
	FORM_SETUP,
	ACCOUNT_CREATE,
} from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import {
	PropertySelect as GA4PropertySelect,
	WebDataStreamSelect as GA4WebDataStreamSelect,
} from '../../../analytics-4/components/common';
import { AccountSelect, GA4PropertyNotice } from '../common';
import SetupUseSnippetSwitchUA from './SetupUseSnippetSwitch';
import { SetupUseSnippetSwitch as SetupUseSnippetSwitchGA4 } from '../../../analytics-4/components/setup';
const { useSelect, useDispatch } = Data;

export default function SetupFormGA4Legacy() {
	const accounts =
		useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccounts() ) ||
		[];

	const uaHasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasExistingTag()
	);
	const ga4HasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasExistingTag()
	);
	const ga4ExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);
	const ga4MeasurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const { selectProperty } = useDispatch( MODULES_ANALYTICS );
	const { setValues } = useDispatch( CORE_FORMS );
	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

	const shouldShowAssociatedPropertyNotice =
		accountID && accountID !== ACCOUNT_CREATE && ga4PropertyID;

	useMount( () => {
		selectProperty( PROPERTY_CREATE );
		setValues( FORM_SETUP, {
			profileName: _x(
				'All Web Site Data',
				'default Analytics view name',
				'google-site-kit'
			),
		} );
	} );

	useEffect( () => {
		if ( ga4HasExistingTag ) {
			setUseSnippet( ga4ExistingTag !== ga4MeasurementID );
		}
	}, [ setUseSnippet, ga4HasExistingTag, ga4ExistingTag, ga4MeasurementID ] );

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
				<GA4PropertySelect />
				<GA4WebDataStreamSelect />
			</div>

			{ ga4HasExistingTag && <SetupUseSnippetSwitchGA4 /> }

			{ shouldShowAssociatedPropertyNotice && (
				<GA4PropertyNotice
					notice={ __(
						'An associated Universal Analytics property will also be created.',
						'google-site-kit'
					) }
				>
					{ uaHasExistingTag && <SetupUseSnippetSwitchUA /> }
				</GA4PropertyNotice>
			) }
		</Fragment>
	);
}
