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

const WidgetWithComponentProps =
	withWidgetComponentProps( 'test' )( MetricTileNumeric );

function Template( { ...args } ) {
	return <WidgetWithComponentProps { ...args } />;
}

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
	label: 'KeyMetrics/MetricTileNumeric/Positive',
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
	label: 'KeyMetrics/MetricTileNumeric/Negative',
	delay: 250,
};

export const ZeroChange = Template.bind( {} );
ZeroChange.storyName = 'Zero Change';
ZeroChange.args = {
	title: 'New Visitors',
	metricValue: 100,
	subText: 'of 1,234 total visitors',
	currentValue: 100,
	previousValue: 100,
};
ZeroChange.scenario = {
	label: 'KeyMetrics/MetricTileNumeric/ZeroChange',
	delay: 250,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	title: 'New Visitors',
	metricValue: 0,
	subText: 'of 0 total visitors',
	currentValue: 0,
	previousValue: 0,
};
ZeroData.scenario = {
	label: 'KeyMetrics/MetricTileNumeric/ZeroData',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	title: 'New Visitors',
	metricValue: 0,
	subText: 'of 0 total visitors',
	currentValue: 0,
	previousValue: 0,
	loading: true,
};
// Since the "Loading" state is the same for all KMW tiles, this is the sole scenario
// and should not be added to any other generic `MetricTile___` or KMW component.
Loading.scenario = {
	label: 'KeyMetrics/MetricTileNumeric/Loading',
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

export default {
	title: 'Key Metrics/WidgetTiles/MetricTileNumeric',
	component: MetricTileNumeric,
};
