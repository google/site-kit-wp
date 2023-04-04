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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import {
	PropertySelect as GA4PropertySelect,
	WebDataStreamSelect as GA4WebDataStreamSelect,
} from '../../../analytics-4/components/common';
import { AccountSelect } from '../common';
import SetupUseSnippetSwitchUA from './SetupUseSnippetSwitch';
import EnableUniversalAnalytics from '../common/EnableUniversalAnalytics';
const { useSelect } = Data;

export default function SetupFormGA4() {
	const accounts =
		useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccounts() ) ||
		[];

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

			<EnableUniversalAnalytics>
				<SetupUseSnippetSwitchUA />
			</EnableUniversalAnalytics>
		</Fragment>
	);
}
