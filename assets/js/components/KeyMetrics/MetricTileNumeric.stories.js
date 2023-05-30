/**
 * MetricTileNumeric Component Stories.
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
import MetricTileNumeric from './MetricTileNumeric';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';

const WidgetWithComponentProps = withWidgetComponentProps(
	'kmAnalyticsNewVisitors'
)( MetricTileNumeric );

const Template = ( { ...args } ) => <WidgetWithComponentProps { ...args } />;

export const Positive = Template.bind( {} );
Positive.storyName = 'Positive';
Positive.args = {
	title: 'New Visitors',
	metricValue: 100,
	subText: 'of 1,234 total visitors',
	currentValue: 100,
	previousValue: 91,
};
Positive.scenario = {
	label: 'Components/KeyMetrics/Widgets/MetricTileNumeric/Positive',
	delay: 250,
};

export const Negative = Template.bind( {} );
Negative.storyName = 'Negative';
Negative.args = {
	title: 'New Visitors',
	metricValue: 100,
	subText: 'of 1,234 total visitors',
	currentValue: 91,
	previousValue: 103,
};
Negative.scenario = {
	label: 'Components/KeyMetrics/Widgets/MetricTileNumeric/Negative',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	loading: true,
};

export default {
	title: 'Components/KeyMetrics/WidgetTiles/MetricTileNumeric',
	component: MetricTileNumeric,
};
