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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { ExistingGTMPropertyNotice } from '../common';
import DisplaySetting from '../../../../components/DisplaySetting';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4SettingsView from './GA4SettingsView';
import UASettingsView from './UASettingsView';
import OptionalSettingsView from './OptionalSettingsView';
import {
	DASHBOARD_VIEW_GA4,
	MODULES_ANALYTICS,
} from '../../datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import Link from '../../../../components/Link';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect } = Data;

export default function SettingsView() {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );
	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );
	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const isTagManagerAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'tagmanager' )
	);

	const gtmAnalyticsPropertyID = useSelect(
		( select ) =>
			isTagManagerAvailable &&
			select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID()
	);

	const dashboardView = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getDashboardView()
	);

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			{ ga4ReportingEnabled && ! isGA4Connected && (
				<SettingsNotice
					type={ TYPE_WARNING }
					LearnMore={ () => (
						<Link href={ documentationURL } external>
							{ __( 'Learn more', 'google-site-kit' ) }
						</Link>
					) }
					notice={ __(
						'Your current Universal Analytics property will stop collecting data on July 1, 2023',
						'google-site-kit'
					) }
				/>
			) }

			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>

			<ExistingGTMPropertyNotice
				gtmAnalyticsPropertyID={ gtmAnalyticsPropertyID }
			/>

			{ ga4ReportingEnabled && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Dashboard view', 'google-site-kit' ) }
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
					</div>
				</div>
			) }

			<UASettingsView />

			<GA4SettingsView />

			<OptionalSettingsView />
		</div>
	);
}
