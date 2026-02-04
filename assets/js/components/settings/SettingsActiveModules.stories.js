/**
 * SettingsActiveModules stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
	provideModuleRegistrations,
	provideModules,
} from './../../../../tests/js/utils';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	CONTENT_POLICY_STATES,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import SettingsActiveModules from './SettingsActiveModules';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';

function Template() {
	return <SettingsActiveModules />;
}

export const Default = Template.bind( {} );
Default.args = {
	setupRegistry: ( registry ) => {
		provideModules(
			registry,
			[
				MODULE_SLUG_ADS,
				MODULE_SLUG_ADSENSE,
				MODULE_SLUG_ANALYTICS_4,
				MODULE_SLUG_PAGESPEED_INSIGHTS,
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) )
		);
	},
};
Default.scenario = {};

export const WithActiveButNotConnectedModule = Template.bind( {} );
WithActiveButNotConnectedModule.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			...[
				MODULE_SLUG_ADS,
				MODULE_SLUG_ADSENSE,
				MODULE_SLUG_ANALYTICS_4,
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) ),
			{
				slug: MODULE_SLUG_PAGESPEED_INSIGHTS,
				active: true,
				connected: false,
			},
		] );
	},
};

export const WithCustomStatusComponent = Template.bind( {} );
WithCustomStatusComponent.args = {
	setupRegistry: ( registry ) => {
		function CustomStatusComponent( { slug } ) {
			return (
				<div
					style={ {
						padding: '8px 12px',
						backgroundColor: '#f0f0f1',
						borderRadius: '4px',
						fontSize: '14px',
						fontWeight: '500',
					} }
				>
					Custom Status: { slug }
				</div>
			);
		}

		provideModules( registry, [
			...[
				MODULE_SLUG_ADS,
				MODULE_SLUG_ADSENSE,
				MODULE_SLUG_ANALYTICS_4,
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) ),
			{
				slug: MODULE_SLUG_PAGESPEED_INSIGHTS,
				active: true,
				connected: true,
				SettingsStatusComponent: CustomStatusComponent,
			},
		] );
	},
};

export const WithRRMActionNeeded = Template.bind( {} );
WithRRMActionNeeded.args = {
	setupRegistry: ( registry ) => {
		provideModules(
			registry,
			[
				MODULE_SLUG_ADS,
				MODULE_SLUG_ADSENSE,
				MODULE_SLUG_ANALYTICS_4,
				MODULE_SLUG_READER_REVENUE_MANAGER,
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
			].map( ( slug ) => ( {
				slug,
				active: true,
				connected: true,
			} ) )
		);

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				publicationID: 'test-publication-id',
				publicationOnboardingState: 'ONBOARDING_COMPLETE',
				contentPolicyStatus: {
					contentPolicyState:
						CONTENT_POLICY_STATES.CONTENT_POLICY_VIOLATION_GRACE_PERIOD,
					policyInfoLink: 'https://example.com/policy-info',
				},
			} );
	},
};
WithRRMActionNeeded.parameters = {
	features: [ 'rrmPolicyViolations' ],
};
WithRRMActionNeeded.scenario = {};

export default {
	title: 'Components/SettingsModules/ConnectedServices',
	component: SettingsActiveModules,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				args?.setupRegistry?.( registry );

				provideModuleRegistrations( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
