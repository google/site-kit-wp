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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import {
	PropertySelect as GA4PropertySelect,
	WebDataStreamSelect as GA4WebDataStreamSelect,
} from '../../../analytics-4/components/common';
import SetupEnhancedMeasurementSwitch from '../../../analytics-4/components/setup/SetupEnhancedMeasurementSwitch';
import { AccountSelect } from '../common';
import { SetupUseSnippetSwitch as SetupUseSnippetSwitchGA4 } from '../../../analytics-4/components/setup';
const { useSelect, useDispatch } = Data;

export default function SetupFormGA4() {
	const accounts =
		useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccounts() ) ||
		[];
	const hasExistingGA4Tag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasExistingTag()
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);
	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);

	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		if ( hasExistingGA4Tag ) {
			setUseSnippet( existingTag !== measurementID );
		}
	}, [ setUseSnippet, hasExistingGA4Tag, existingTag, measurementID ] );

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

			{ hasExistingGA4Tag && <SetupUseSnippetSwitchGA4 /> }
			<SetupEnhancedMeasurementSwitch />
		</Fragment>
	);
}
