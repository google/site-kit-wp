/**
 * AdBlockingRecoverySetupCTANotice component Stories.
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
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';
import AdBlockingRecoverySetupCTANotice from './AdBlockingRecoverySetupCTANotice';

function Template() {
	return <AdBlockingRecoverySetupCTANotice />;
}

const validSettings = {
	accountID: 'pub-12345678',
	clientID: 'ca-pub-12345678',
	useSnippet: false,
	accountStatus: ACCOUNT_STATUS_READY,
	siteStatus: SITE_STATUS_READY,
	adBlockingRecoverySetupStatus: '',
};

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	label: 'Global/AdBlockingRecoverySetupCTANotice/Ready',
};

export default {
	title: ' Modules/AdSense/Settings/AdBlockingRecoverySetupCTANotice',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
				] );
				provideSiteInfo( registry );

				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSettings( validSettings );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
