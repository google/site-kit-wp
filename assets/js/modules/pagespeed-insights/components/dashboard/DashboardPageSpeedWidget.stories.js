/**
 * PageSpeed Insights Module Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	freezeFetch,
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
} from '../../datastore/constants';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardPageSpeedWidget from './DashboardPageSpeedWidget';
import * as fixtures from '../../datastore/__fixtures__';

const url = fixtures.pagespeedMobile.loadingExperience.id;

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	DashboardPageSpeedWidget
);

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		const { dispatch } = registry;
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobile,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktop,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);

		// Component will be loading as long as both reports are not present.
		// Omit receiving mobile here to trigger the request only once.
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktop,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
	},
};

export const TestRunningDisabled = Template.bind( {} );
TestRunningDisabled.storyName = 'Test Running Disabled';
TestRunningDisabled.args = {
	setupRegistry: ( { dispatch } ) => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		// Needs second freezeFetch call, as one is for desktop and the other for mobile.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobileNoFieldData,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktopNoFieldData,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );

		// Invalidate the cached resolver to get the disabled state.
		dispatch( MODULES_PAGESPEED_INSIGHTS ).invalidateResolution(
			'getReport',
			[ url, STRATEGY_DESKTOP ]
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).invalidateResolution(
			'getReport',
			[ url, STRATEGY_MOBILE ]
		);
	},
};

export const NoRecommendations = Template.bind( {} );
NoRecommendations.storyName = 'No Recommendations';
NoRecommendations.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobileNoStackPacks,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktopNoStackPacks,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
	},
};

export const PartialFieldData = Template.bind( {} );
PartialFieldData.storyName = 'Partial Field Data Available';
PartialFieldData.args = {
	setupRegistry: ( registry ) => {
		const { dispatch } = registry;
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobilePartialFieldData,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktopPartialFieldData,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
	},
};

export const FieldDataUnavailable = Template.bind( {} );
FieldDataUnavailable.storyName = 'Field Data Unavailable';
FieldDataUnavailable.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobileNoFieldData,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktopNoFieldData,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Errors for Mobile and Desktop';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const mobileError = {
			code: 'fetching_mobile_data_failed',
			message:
				'Fetching PageSpeed Insights report with strategy mobile failed.',
		};
		const desktopError = {
			code: 'fetching_desktop_data_failed',
			message:
				'Fetching PageSpeed Insights report with strategy desktop failed.',
		};
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveError(
			mobileError,
			'getReport',
			[ url, STRATEGY_MOBILE ]
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveError(
			desktopError,
			'getReport',
			[ url, STRATEGY_DESKTOP ]
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
	},
};

export default {
	title: 'Modules/PageSpeed Insights/Widgets/DashboardPageSpeedWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry, {
					referenceSiteURL: url,
				} );
				provideModules( registry, [
					{
						slug: 'pagespeed-insights',
						active: true,
						connected: true,
					},
				] );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
