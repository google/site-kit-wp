/**
 * Analytics 4 Settings controls.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { AccountSelect, PropertySelect, WebDataStreamSelect } from '../common';
import SettingsEnhancedMeasurementSwitch from './SettingsEnhancedMeasurementSwitch';
import SettingsUseSnippetSwitch from './SettingsUseSnippetSwitch';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import AnalyticsSettingsNotice from './AnalyticsSettingsNotice';
import PropertyOrWebDataStreamNotAvailableError from './PropertyOrWebDataStreamNotAvailableError';
const { useSelect } = Data;

export default function SettingsControls( props ) {
	const { hasModuleAccess } = props;

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess={ hasModuleAccess }
				isDisabled={ ! propertyID }
			/>

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect hasModuleAccess={ hasModuleAccess } />
				<PropertySelect
					hasModuleAccess={ hasModuleAccess }
					isDisabled={ ! propertyID }
				/>
				<WebDataStreamSelect
					hasModuleAccess={ hasModuleAccess }
					isDisabled={ ! propertyID }
				/>
			</div>

			<AnalyticsSettingsNotice hasModuleAccess={ hasModuleAccess } />

			{ propertyID && (
				<div className="googlesitekit-settings-module__meta-item">
					<SettingsUseSnippetSwitch />
				</div>
			) }

			<SettingsEnhancedMeasurementSwitch
				hasModuleAccess={ hasModuleAccess }
			/>
		</div>
	);
}

SettingsControls.propTypes = {
	hasModuleAccess: PropTypes.bool,
};
