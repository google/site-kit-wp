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

// TODO: As part of #8484, update these stories to use the data-mock
// functions to provide report data rather than hardcoding props.
const readyProps = {
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
		dimensionValues: [ 'Dublin', 'London', 'New York' ],
		metricValues: [ 0.388, 0.126, 0.094 ],
		total: 0.608,
	},
	topContent: {
		dimensionValues: [
			'/en/test-post-1/',
			'/en/test-post-2/',
			'/en/test-post-3/',
		],
		metricValues: [ 847, 596, 325 ],
		total: 1768,
	},
	topContentTitles: {
		'/en/test-post-1/':
			'Test Post 1 - This is a very long title to test the audience segmentation tile that it wraps up and doesn not extend to the next line. It should show ellipsis instead. It must also have some gap at the right side so that the post title does not collide with the user count being shown next to it.',
		'/en/test-post-2/': 'Test Post 2',
		'/en/test-post-3/': 'Test Post 3',
	},
};

const audienceResourceName = 'properties/12345/audiences/12345';

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
			'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
			'Lake Chaubunagungamaug',
			'Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu',
		],
		metricValues: [ 0.388, 0.126, 0.094 ],
		total: 0.608,
	},
};
ReadyLongCityNames.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile/ReadyLongCityNames',
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

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceTile',
};
