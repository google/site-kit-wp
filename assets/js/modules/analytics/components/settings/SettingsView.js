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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import SettingsUACutoffWarning from './SettingsUACutoffWarning';
import GA4SettingsView from './GA4SettingsView';
import UASettingsView from './UASettingsView';
import OptionalSettingsView from './OptionalSettingsView';
import {
	DASHBOARD_VIEW_GA4,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { GA4_AUTO_SWITCH_DATE } from '../../../analytics-4/constants';
import { useFeature } from '../../../../hooks/useFeature';
import { isValidProfileID, isValidPropertyID } from '../../util';
import { stringToDate } from '../../../../util';
const { useSelect } = Data;

export default function SettingsView() {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const profileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
	);
	const isUAConnected =
		isValidPropertyID( propertyID ) && isValidProfileID( profileID );

	const dashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getDashboardView()
	);

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

			{ ga4ReportingEnabled &&
				isUAConnected &&
				stringToDate( referenceDate ) <
					stringToDate( GA4_AUTO_SWITCH_DATE ) && (
					<div className="googlesitekit-settings-module__meta-items">
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __( 'Dashboard View', 'google-site-kit' ) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								<DisplaySetting
									value={
										isGA4Connected &&
										dashboardView === DASHBOARD_VIEW_GA4
											? __(
													'Google Analytics 4',
													'google-site-kit'
											  )
											: __(
													'Universal Analytics',
													'google-site-kit'
											  )
									}
								/>
							</p>
							<SettingsUACutoffWarning />
						</div>
					</div>
				) }

			{ ga4ReportingEnabled && (
				<Fragment>
					<GA4SettingsView />
					{ isUAConnected && <UASettingsView /> }
				</Fragment>
			) }

			{ ! ga4ReportingEnabled && (
				<Fragment>
					<UASettingsView />
					<GA4SettingsView />
				</Fragment>
			) }

			<OptionalSettingsView />
		</div>
	);
}
