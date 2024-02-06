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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { AccountSelect, PropertySelect, WebDataStreamSelect } from '../common';
import SettingsEnhancedMeasurementSwitch from './SettingsEnhancedMeasurementSwitch';
import SettingsUseSnippetSwitch from './SettingsUseSnippetSwitch';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4SettingsNotice from './GA4SettingsNotice';
import PropertyOrWebDataStreamNotAvailableError from './PropertyOrWebDataStreamNotAvailableError';
const { useSelect } = Data;

export default function GA4SettingsControls( props ) {
	const { hasAnalytics4Access } = props;

	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const isModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<h4 className="googlesitekit-settings-module__fields-group-title">
				{ __( 'Google Analytics 4', 'google-site-kit' ) }
			</h4>

			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			<PropertyOrWebDataStreamNotAvailableError
				hasModuleAccess={ hasAnalytics4Access }
				isDisabled={ ! propertyID }
			/>

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect hasModuleAccess={ hasAnalytics4Access } />
				<PropertySelect
					hasModuleAccess={ hasAnalytics4Access }
					isDisabled={ ! propertyID }
				/>
				<WebDataStreamSelect
					hasModuleAccess={ hasAnalytics4Access }
					isDisabled={ ! propertyID }
				/>
			</div>

			<GA4SettingsNotice
				isModuleConnected={ isModuleConnected }
				hasAnalytics4Access={ hasAnalytics4Access }
			/>

			{ propertyID && (
				<div className="googlesitekit-settings-module__meta-item">
					<SettingsUseSnippetSwitch />
				</div>
			) }

			<SettingsEnhancedMeasurementSwitch
				hasAnalytics4Access={ hasAnalytics4Access }
			/>
		</div>
	);
}

// eslint-disable-next-line sitekit/acronym-case
GA4SettingsControls.propTypes = {
	hasAnalytics4Access: PropTypes.bool,
};
