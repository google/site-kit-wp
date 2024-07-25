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
import WithRegistrySetup from '../../../../../../../../../tests/js/WithRegistrySetup';
import { provideUserAuthentication } from '../../../../../../../../../tests/js/utils';
import { Provider as ViewContextProvider } from '../../../../../../../components/Root/ViewContextContext';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../../googlesitekit/constants';
import AudienceTile from '.';
import { getPreviousDate } from '../../../../../../../util';
import { withWidgetComponentProps } from '../../../../../../../googlesitekit/widgets/util';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'audienceTile' )( AudienceTile );

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	const setupRegistryCallback = ( registry ) => {
		provideUserAuthentication( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
		} );
		setupRegistry( registry );
	};

	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<WidgetWithComponentProps { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

const audienceResourceName = 'properties/12345/audiences/12345';

// TODO: As part of #8484, update these stories to use the data-mock
// functions to provide report data rather than hardcoding props.
const readyProps = {
	audienceResourceName,
	title: 'New visitors',
	toolTip: 'This is a tooltip',
	loaded: true,
	visitors: {
		metricValue: 24200,
		currentValue: 24200,
		previousValue: 20424,
	},
	visitsPerVisitor: {
		metricValue: 3,
		currentValue: 3,
		previousValue: 2,
	},
	pagesPerVisit: {
		metricValue: 2,
		currentValue: 2,
		previousValue: 3,
	},
	pageviews: {
		metricValue: 1565,
		currentValue: 1565,
		previousValue: 1504,
	},
	percentageOfTotalPageViews: 0.333,
	topCities: {
		dimensionValues: [
			{
				value: 'Dublin',
			},
			{
				value: 'London',
			},
			{
				value: 'New York',
			},
		],
		metricValues: [
			{
				value: 0.388,
			},
			{
				value: 0.126,
			},
			{
				value: 0.094,
			},
		],
		total: 0.608,
	},
	topContent: {
		dimensionValues: [
			{
				value: '/en/test-post-1/',
			},
			{
				value: '/en/test-post-2/',
			},
			{
				value: '/en/test-post-3/',
			},
		],
		metricValues: [
			{
				value: 847,
			},
			{
				value: 596,
			},
			{
				value: 325,
			},
		],
		total: 1768,
	},
	topContentTitles: {
		'/en/test-post-1/':
			'Test Post 1 - This is a very long title to test the audience segmentation tile that it wraps up and doesn not extend to the next line. It should show ellipsis instead. It must also have some gap at the right side so that the post title does not collide with the user count being shown next to it.',
		'/en/test-post-2/': 'Test Post 2',
		'/en/test-post-3/': 'Test Post 3',
	},
	isZeroData: false,
	isPartialData: false,
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
	topCities: {
		dimensionValues: [
			{
				value: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
			},
			{
				value: 'Lake Chaubunagungamaug',
			},
			{
				value: 'Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu',
			},
		],
		metricValues: [
			{
				value: 0.388,
			},
			{
				value: 0.126,
			},
			{
				value: 0.094,
			},
		],
		total: 0.608,
	},
};
ReadyLongCityNames.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ReadyLongCityNames',
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	...readyProps,
	isLoading: true,
};
Loading.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];
Loading.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/Loading',
};

export const NoData = Template.bind( {} );
NoData.storyName = 'NoData';
NoData.args = {
	...readyProps,
	topCities: null,
	topContent: null,
};
NoData.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/NoData',
};

export const MissingCustomDimension = Template.bind( {} );
MissingCustomDimension.storyName = 'MissingCustomDimension';
MissingCustomDimension.args = {
	...readyProps,
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableCustomDimensions: [],
		} );
	},
};
MissingCustomDimension.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/MissingCustomDimension',
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
