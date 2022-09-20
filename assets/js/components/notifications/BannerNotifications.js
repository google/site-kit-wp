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
import IdeaHubPromptBannerNotification from './IdeaHubPromptBannerNotification';
import UserInputPromptBannerNotification from './UserInputPromptBannerNotification';
import AdSenseAlerts from './AdSenseAlerts';
import ActivationBanner from '../../modules/analytics-4/components/dashboard/ActivationBanner';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import useViewOnly from '../../hooks/useViewOnly';
import ZeroDataStateNotifications from './ZeroDataStateNotifications';
import ThankWithGoogleSupporterWallNotification from './ThankWithGoogleSupporterWallNotification';
const { useSelect } = Data;

export default function BannerNotifications() {
	const dashboardSharingEnabled = useFeature( 'dashboardSharing' );
	const ideaHubModuleEnabled = useFeature( 'ideaHubModule' );
	const userInputEnabled = useFeature( 'userInput' );
	const ga4ActivationBannerEnabled = useFeature( 'ga4ActivationBanner' );
	const twgEnabled = useFeature( 'twgModule' );

	const viewOnly = useViewOnly();

	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);
	const adSenseModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'adsense' )
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
					{ isAuthenticated && <CoreSiteBannerNotifications /> }
					{ dashboardSharingEnabled && <ModuleRecoveryAlert /> }
					{ ga4ActivationBannerEnabled && <ActivationBanner /> }
				</Fragment>
			) }
			{ twgEnabled && <ThankWithGoogleSupporterWallNotification /> }
			<ZeroDataStateNotifications />
			{ ! viewOnly && (
				<Fragment>
					{ userInputEnabled && (
						<UserInputPromptBannerNotification />
					) }
					{ ideaHubModuleEnabled && (
						<IdeaHubPromptBannerNotification />
					) }
					{ adSenseModuleActive && <AdSenseAlerts /> }
				</Fragment>
			) }
		</Fragment>
	);
}
