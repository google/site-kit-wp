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
import { ProgressBar } from 'googlesitekit-components';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4SettingsView from './GA4SettingsView';
import OptionalSettingsView from './OptionalSettingsView';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import useMigrateAdsConversionID from '../../../analytics-4/hooks/useMigrateAdsConversionID';

export default function SettingsView() {
	const isMigratingAdsConversionID = useMigrateAdsConversionID();

	if ( isMigratingAdsConversionID ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			<GA4SettingsView />

			<OptionalSettingsView />
		</div>
	);
}
