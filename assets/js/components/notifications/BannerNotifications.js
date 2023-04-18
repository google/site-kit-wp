/**
 * BannerNotifications component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { useFeature } from '../../hooks/useFeature';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import useQueryArg from '../../hooks/useQueryArg';
import SetupSuccessBannerNotification from './SetupSuccessBannerNotification';
import CoreSiteBannerNotifications from './CoreSiteBannerNotifications';
import ModuleRecoveryAlert from '../dashboard-sharing/ModuleRecoveryAlert';
import UserInputPromptBannerNotification from './UserInputPromptBannerNotification';
import AdSenseAlerts from './AdSenseAlerts';
import ActivationBanner from '../../modules/analytics-4/components/dashboard/ActivationBanner';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import useViewOnly from '../../hooks/useViewOnly';
import ZeroDataStateNotifications from './ZeroDataStateNotifications';
import EnableAutoUpdateBannerNotification from './EnableAutoUpdateBannerNotification';
import GoogleTagIDMismatchNotification from './GoogleTagIDMismatchNotification';
import SwitchGA4DashboardViewNotification from './SwitchGA4DashboardViewNotification';
import { GTM_SCOPE } from '../../modules/analytics-4/datastore/constants';
import WebDataStreamNotAvailableNotification from './WebDataStreamNotAvailableNotification';

const { useSelect } = Data;

export default function BannerNotifications() {
	const dashboardSharingEnabled = useFeature( 'dashboardSharing' );
	const userInputEnabled = useFeature( 'userInput' );
	const ga4ActivationBannerEnabled = useFeature( 'ga4ActivationBanner' );
	const gteSupportEnabled = useFeature( 'gteSupport' );
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );

	const viewOnly = useViewOnly();

	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);
	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'adsense' )
	);

	const analyticsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const hasGTMScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( GTM_SCOPE )
	);

	const [ notification ] = useQueryArg( 'notification' );

	return (
		<Fragment>
			{ ! viewOnly && (
				<Fragment>
					{ ( 'authentication_success' === notification ||
						'user_input_success' === notification ) && (
						<SetupSuccessBannerNotification />
					) }
					<EnableAutoUpdateBannerNotification />
					{ isAuthenticated && <CoreSiteBannerNotifications /> }
					{ dashboardSharingEnabled && <ModuleRecoveryAlert /> }
					{ ga4ActivationBannerEnabled && <ActivationBanner /> }
					{ gteSupportEnabled && ga4ModuleConnected && hasGTMScope && (
						<Fragment>
							<GoogleTagIDMismatchNotification />
							<WebDataStreamNotAvailableNotification />
						</Fragment>
					) }
				</Fragment>
			) }
			<ZeroDataStateNotifications />
			{ ! viewOnly && (
				<Fragment>
					{ userInputEnabled && (
						<UserInputPromptBannerNotification />
					) }
					{ adSenseModuleActive && <AdSenseAlerts /> }
					{ ga4ReportingEnabled && analyticsModuleConnected && (
						<SwitchGA4DashboardViewNotification />
					) }
				</Fragment>
			) }
		</Fragment>
	);
}
