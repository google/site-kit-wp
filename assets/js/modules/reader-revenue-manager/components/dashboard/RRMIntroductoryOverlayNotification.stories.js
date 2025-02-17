/**
 * RRMIntroductoryOverlayNotification component stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	provideUserInfo,
} from '../../../../../../tests/js/utils';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import RRMIntroductoryOverlayNotification from './RRMIntroductoryOverlayNotification';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template() {
	return <RRMIntroductoryOverlayNotification />;
}

export const NoPayment = Template.bind( {} );
NoPayment.storyName = 'Without monetary CTA';
NoPayment.scenario = {};
NoPayment.args = {
	paymentOption: 'noPayment',
};

export const Empty = Template.bind( {} );
Empty.storyName = 'Without any CTA';
Empty.scenario = {};
Empty.args = {
	paymentOption: '',
};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/RRMIntroductoryOverlayNotification',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideUserInfo( registry );
				provideModules( registry, [
					{
						slug: 'reader-revenue-manager',
						active: true,
						connected: true,
					},
				] );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						publicationID: '1234567',
						publicationOnboardingState: 'ONBOARDING_COMPLETE',
						paymentOption: args.paymentOption,
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
						<Story />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
