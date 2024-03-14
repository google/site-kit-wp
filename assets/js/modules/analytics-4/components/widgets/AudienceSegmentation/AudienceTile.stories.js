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
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../googlesitekit/constants';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import AudienceTile from './AudienceTile';

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

const ReadyProps = {
	title: 'New Visitors',
	toolTip: 'This is a tooltip',
	visitors: {
		title: 'Visitors',
		metricValue: 24200,
		currentValue: 24200,
		previousValue: 20424,
	},
	visitsPerVisitors: {
		title: 'Visits per visitor',
		metricValue: 3,
		currentValue: 3,
		previousValue: 2,
	},
	pagesPerVisit: {
		title: 'Pages per visit',
		metricValue: 2,
		currentValue: 2,
		previousValue: 3,
	},
	pageviews: {
		title: 'Pageviews',
		metricValue: 1565,
		currentValue: 1565,
		previousValue: 1504,
	},
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
		'/en/test-post-1/': 'Test Post 1',
		'/en/test-post-2/': 'Test Post 2',
		'/en/test-post-3/': 'Test Post 3',
	},
};

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = ReadyProps;
Ready.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTile/Ready',
	delay: 250,
};

export const ReadWithToolTip = Template.bind( {} );
ReadWithToolTip.storyName = 'ReadWithToolTip';
ReadWithToolTip.args = {
	...ReadyProps,
	infoTooltip: 'This is a tooltip',
};
ReadWithToolTip.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTile/ReadWithToolTip',
	delay: 250,
};

export const ReadyViewOnly = Template.bind( {} );
ReadyViewOnly.storyName = 'ReadyViewOnly';
ReadyViewOnly.args = {
	...ReadyProps,
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ReadyViewOnly.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTile/ReadyViewOnly',
	delay: 250,
};

export const PartialNoData = Template.bind( {} );
PartialNoData.storyName = 'PartialNoData';
PartialNoData.args = {
	...ReadyProps,
	topCities: null,
	topContent: null,
};
PartialNoData.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTile/PartialNoData',
	delay: 250,
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTile',
};
