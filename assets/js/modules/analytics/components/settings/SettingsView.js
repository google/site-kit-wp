/**
 * Analytics Settings View component.
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
 * Internal dependencies
 */
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { ExistingGTMPropertyNotice } from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import UASnippetSettingsView from './UASnippetSettingsView';
import GA4SettingsView from './GA4SettingsView';
import UASettingsView from './UASettingsView';
import IPAnonymizationSettingsView from './IPAnonymizationSettingsView';
import ExcludeFromAnalyticsSettingsView from './ExcludeFromAnalyticsSettingsView';
import AddConversionIDSettingsView from './AddConversionIDSettingsView';

export default function SettingsView() {
	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>

			<ExistingGTMPropertyNotice />

			<UASettingsView />

			<UASnippetSettingsView />

			<GA4SettingsView />

			<IPAnonymizationSettingsView />

			<ExcludeFromAnalyticsSettingsView />

			<AddConversionIDSettingsView />
		</div>
	);
}
