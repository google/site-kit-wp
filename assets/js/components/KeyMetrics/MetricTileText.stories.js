/**
 * MetricTileText Component Stories.
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
import MetricTileText from './MetricTileText';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'test' )( MetricTileText );

function Template( { ...args } ) {
	return <WidgetWithComponentProps { ...args } />;
}

export const Positive = Template.bind( {} );
Positive.storyName = 'Positive';
Positive.args = {
	title: 'Most engaged traffic source',
	metricValue: 'Mobile Push Notifications',
	subText: '25% of engaged sessions',
	currentValue: 100,
	previousValue: 91,
};
Positive.scenario = {
	delay: 250,
};

export const Negative = Template.bind( {} );
Negative.storyName = 'Negative';
Negative.args = {
	title: 'Most engaged traffic source',
	metricValue: 'Mobile Push Notifications',
	subText: '25% of engaged sessions',
	currentValue: 91,
	previousValue: 103,
};
Negative.scenario = {
	delay: 250,
};

export const ZeroChange = Template.bind( {} );
ZeroChange.storyName = 'Zero Change';
ZeroChange.args = {
	title: 'Most engaged traffic source',
	metricValue: 'Mobile Push Notifications',
	subText: '25% of engaged sessions',
	currentValue: 100,
	previousValue: 100,
};
ZeroChange.scenario = {
	delay: 250,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	title: 'Most engaged traffic source',
	metricValue: '-',
	subText: '0% of engaged sessions',
	currentValue: 0,
	previousValue: 0,
};
// Since the "Zero" state is similar for all "textual" KMW tiles, this should be
// the sole scenario and should not be added to any other "text" type KMW components.
ZeroData.scenario = {
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	title: 'Most engaged traffic source',
	loading: true,
};

export default {
	title: 'Key Metrics/WidgetTiles/MetricTileText',
	component: MetricTileText,
};
