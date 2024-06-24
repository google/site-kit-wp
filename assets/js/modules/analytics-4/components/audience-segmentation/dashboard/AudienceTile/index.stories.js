/**
 * AudienceTile Component Stories.
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
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../../../components/Root/ViewContextContext';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';
import AudienceTile from '.';
import { getPreviousDate } from '../../../../../../util';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { availableAudiences as audiencesList } from '../../../../datastore/__fixtures__';
import {
	getAnalytics4MockResponse,
	getAnalytics4MockPivotResponse,
} from '../../../../utils/data-mock';

const availableAudiences = audiencesList.filter(
	( audience ) => audience.audienceSlug === 'new-visitors'
);

const audienceResourceName = availableAudiences[ 0 ].name;
const configuredAudiences = [ audienceResourceName ];

const dimensionFilters = {
	audienceResourceName: configuredAudiences,
};

const reportOptions = {
	compareEndDate: '2024-02-28',
	compareStartDate: '2024-02-01',
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	dimensions: [ { name: 'audienceResourceName' } ],
	dimensionFilters,
	metrics: [
		{ name: 'totalUsers' },
		{ name: 'sessionsPerUser' },
		{ name: 'screenPageViewsPerSession' },
		{ name: 'screenPageViews' },
	],
};

const report = getAnalytics4MockResponse( reportOptions );
const reportRow = report?.rows?.[ 0 ];
const previousReportRow = report?.rows?.[ 1 ];

const topContentPageTitlesReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	dimensions: [
		{ name: 'pagePath' },
		{ name: 'pageTitle' },
		{ name: 'audienceResourceName' },
	],
	metrics: [ { name: 'screenPageViews' } ],
	pivots: [
		{
			fieldNames: [ 'pagePath', 'pageTitle' ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 15,
		},
	],
};

const titleReportOptions = {
	...topContentPageTitlesReportOptions,
	dimensionFilters,
	pivots: [
		...topContentPageTitlesReportOptions.pivots,
		{
			fieldNames: [ 'audienceResourceName' ],
			limit: configuredAudiences?.length,
		},
	],
};

const topContentTitlesReport =
	getAnalytics4MockPivotResponse( titleReportOptions );

const topCitiesReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	dimensions: [ { name: 'city' }, { name: 'audienceResourceName' } ],
	metrics: [ { name: 'totalUsers' } ],
	dimensionFilters,
	pivots: [
		{
			fieldNames: [ 'city' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			limit: 3,
		},
		{
			fieldNames: [ 'audienceResourceName' ],
			limit: configuredAudiences?.length,
		},
	],
};

const topCitiesReport = getAnalytics4MockPivotResponse(
	topCitiesReportOptions
);

const totalPageviewsReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	metrics: [ { name: 'screenPageViews' } ],
};

const totalPageviewsReport = getAnalytics4MockResponse(
	totalPageviewsReportOptions
);

const topContentReportOptions = {
	endDate: '2024-03-27',
	startDate: '2024-02-29',
	dimensions: [ { name: 'pagePath' }, { name: 'audienceResourceName' } ],
	metrics: [ { name: 'screenPageViews' } ],
	dimensionFilters,
	pivots: [
		{
			fieldNames: [ 'pagePath' ],
			orderby: [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			],
			limit: 3,
		},
		{
			fieldNames: [ 'audienceResourceName' ],
			limit: configuredAudiences?.length,
		},
	],
};

const topContentReport = getAnalytics4MockPivotResponse(
	topContentReportOptions
);

const WidgetWithComponentProps =
	withWidgetComponentProps( 'audienceTile' )( AudienceTile );

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<WidgetWithComponentProps { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

const readyProps = {
	title: availableAudiences[ 0 ].displayName,
	toolTip: 'This is a tooltip',
	loaded: true,
	isZeroData: false,
	isPartialData: false,
	reportRow,
	previousReportRow,
	audienceResourceName,
	topContentTitlesReport,
	topCitiesReport,
	totalPageviewsReport,
	topContentReport,
};

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = readyProps;
Ready.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/Ready',
};

export const ReadyWithToolTip = Template.bind( {} );
ReadyWithToolTip.storyName = 'ReadyWithToolTip';
ReadyWithToolTip.args = {
	...readyProps,
	infoTooltip: 'This is a tooltip',
};
ReadyWithToolTip.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ReadyWithToolTip',
};

export const ReadyViewOnly = Template.bind( {} );
ReadyViewOnly.storyName = 'ReadyViewOnly';
ReadyViewOnly.args = {
	...readyProps,
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ReadyViewOnly.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ReadyViewOnly',
};

export const ReadyLongCityNames = Template.bind( {} );
ReadyLongCityNames.storyName = 'ReadyLongCityNames';
ReadyLongCityNames.args = {
	...readyProps,
	topCitiesReport: {
		...topCitiesReport,
		rows: ( () => {
			const longCityNames = [
				'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
				'Lake Chaubunagungamaug',
				'Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu',
			];

			return topCitiesReport.rows.map( ( row, index ) => {
				const { dimensionValues, metricValues } = row;

				return {
					dimensionValues: [
						{ value: longCityNames[ index ] },
						dimensionValues[ 1 ],
					],
					metricValues,
				};
			} );
		} )(),
	},
};
ReadyLongCityNames.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ReadyLongCityNames',
};

export const NoData = Template.bind( {} );
NoData.storyName = 'NoData';
NoData.args = {
	...readyProps,
	reportRow: {},
	previousReportRow: {},
	topContentTitlesReport: {},
	topCitiesReport: {},
	totalPageviewsReport: {},
	topContentReport: {},
};
NoData.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/NoData',
};

export const AudiencePartialData = Template.bind( {} );
AudiencePartialData.storyName = 'Audience partial data';
AudiencePartialData.args = {
	...readyProps,
	infoTooltip: 'This is a tooltip',
	audienceResourceName,
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {
					[ audienceResourceName ]: dataAvailabilityDate,
				},
				customDimension: {},
				property: {},
			} );
	},
};
AudiencePartialData.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/AudiencePartialData',
};

export const TopContentPartialData = Template.bind( {} );
TopContentPartialData.storyName = 'Top content partial data';
TopContentPartialData.args = {
	...readyProps,
	infoTooltip: 'This is a tooltip',
	audienceResourceName,
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		const { startDate } = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );

		const dataAvailabilityDate = Number(
			getPreviousDate( startDate, -1 ).replace( /-/g, '' )
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: {},
				customDimension: {
					googlesitekit_post_type: dataAvailabilityDate,
				},
				property: {},
			} );
	},
};
TopContentPartialData.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/TopContentPartialData',
};

export const ZeroDataHideable = Template.bind( {} );
ZeroDataHideable.storyName = 'ZeroDataHideable';
ZeroDataHideable.args = {
	...readyProps,
	infoTooltip: 'This is a tooltip',
	audienceResourceName,
	isZeroData: true,
	isPartialData: true,
	isTileHideable: true,
	onHideTile: () => {},
};
ZeroDataHideable.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ZeroDataHideable',
};

export const ZeroDataNonHideable = Template.bind( {} );
ZeroDataNonHideable.storyName = 'ZeroDataNonHideable';
ZeroDataNonHideable.args = {
	...readyProps,
	infoTooltip: 'This is a tooltip',
	audienceResourceName,
	isZeroData: true,
	isPartialData: true,
};
ZeroDataNonHideable.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ZeroDataNonHideable',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile',
};
