/**
 * AdBlockingRecoverySetupSuccessBannerNotification component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	MODULES_ADSENSE,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
} from '../../modules/adsense/datastore/constants';
import AdBlockingRecoverySetupSuccessBannerNotification from './AdBlockingRecoverySetupSuccessBannerNotification';
import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
} from '../../../../tests/js/utils';

function Template( { ...args } ) {
	return <AdBlockingRecoverySetupSuccessBannerNotification { ...args } />;
}

export const AdBlockingRecoverySetupSuccessBannerNotificationDefault =
	Template.bind( {} );
AdBlockingRecoverySetupSuccessBannerNotificationDefault.storyName = 'Default';

export default {
	title: 'Components/AdBlockingRecoverySetupSuccessBannerNotification',
	component: AdBlockingRecoverySetupSuccessBannerNotification,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideSiteInfo( registry );
			provideModules( registry, [
				{
					slug: 'adsense',
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( MODULES_ADSENSE ).setSettings( {
				accountID: 'pub-123456',
				adBlockingRecoverySetupStatus:
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
			} );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
