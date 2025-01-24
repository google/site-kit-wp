/**
 * ModuleOverviewWidget Component Stories.
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
 * Internal dependencies
 */
import ModuleOverviewWidget from '.';
import { replaceValuesInAdSenseReportWithZeroData } from '../../../../../../../.storybook/utils/zeroReports';
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import {
	getAdSenseMockResponse,
	provideAdSenseMockReports,
} from '../../../util/data-mock';

const adSenseAccountID = 'pub-1234567890';

const storyReportOptions = [
	{
		metrics: [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		],
		startDate: '2021-10-28',
		endDate: '2021-11-24',
	},
	{
		dimensions: [ 'DATE' ],
		metrics: [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		],
		startDate: '2021-10-28',
		endDate: '2021-11-24',
	},
	{
		metrics: [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		],
		startDate: '2021-09-30',
		endDate: '2021-10-27',
	},
	{
		dimensions: [ 'DATE' ],
		metrics: [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
			'PAGE_VIEWS_CTR',
		],
		startDate: '2021-09-30',
		endDate: '2021-10-27',
	},
];

const WidgetWithComponentProps = withWidgetComponentProps(
	'adsenseModuleOverview'
)( ModuleOverviewWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry ) => {
		provideAdSenseMockReports( registry, storyReportOptions );
	},
};
Default.scenario = {
	label: 'AdSense Module/Overview Widget',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		provideAdSenseMockReports( registry, storyReportOptions );

		storyReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ADSENSE )
				.startResolution( 'getReport', [ options ] );
		} );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		storyReportOptions.forEach( ( options ) => {
			const report = getAdSenseMockResponse( options );
			const zeroReport =
				replaceValuesInAdSenseReportWithZeroData( report );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetReport( zeroReport, { options } );
		} );
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const firstReportOptions = storyReportOptions[ 0 ];
		const remainingReportOptions = storyReportOptions.slice( 1 );

		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};

		registry
			.dispatch( MODULES_ADSENSE )
			.receiveError( error, 'getReport', [ firstReportOptions ] );
		registry
			.dispatch( MODULES_ADSENSE )
			.finishResolution( 'getReport', [ firstReportOptions ] );

		provideAdSenseMockReports( registry, remainingReportOptions );
	},
};

export default {
	title: 'Modules/AdSense/Widgets/ModuleOverviewWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2021-11-25' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdSenseLinked( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsGatheringData( false );

				registry
					.dispatch( MODULES_ADSENSE )
					.setAccountID( adSenseAccountID );

				args?.setupRegistry?.( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
