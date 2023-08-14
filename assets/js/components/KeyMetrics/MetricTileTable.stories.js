/**
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
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import MetricTileTable from './MetricTileTable';

const WidgetWithComponentProps =
	withWidgetComponentProps( 'test' )( MetricTileTable );

const Template = ( { ...args } ) => <WidgetWithComponentProps { ...args } />;

const title = 'Metric tile table';
const columns = [
	{
		field: 'field1.0',
		Component: ( { fieldValue } ) => (
			<a href="http://example.com">{ fieldValue }</a>
		),
	},
	{
		field: 'field2',
		Component: ( { fieldValue } ) => <strong>{ fieldValue }</strong>,
	},
];

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	title,
	rows: [
		{
			field1: [ 'keyword1' ],
			field2: 0.112,
		},
		{
			field1: [ 'keyword2' ],
			field2: 0.212,
		},
		{
			field1: [ 'keyword3' ],
			field2: 0.312,
		},
	],
	columns,
};
Ready.scenario = {
	label: 'KeyMetrics/MetricTileTable/Ready',
	delay: 250,
};

export const ReadyWithInfoTooltip = Template.bind( {} );
ReadyWithInfoTooltip.storyName = 'Ready With Info Tooltip';
ReadyWithInfoTooltip.args = {
	title,
	rows: [
		{
			field1: [ 'keyword1' ],
			field2: 0.112,
		},
		{
			field1: [ 'keyword2' ],
			field2: 0.212,
		},
		{
			field1: [ 'keyword3' ],
			field2: 0.312,
		},
	],
	columns,
	infoTooltip: 'This is a tooltip',
};
ReadyWithInfoTooltip.scenario = {
	label: 'KeyMetrics/MetricTileTable/ReadyWithInfoTooltip',
	delay: 250,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	title,
	rows: [],
	columns,
	ZeroState: () => <div>No data available</div>,
};
ZeroData.scenario = {
	label: 'KeyMetrics/MetricTileTable/ZeroData',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	title,
	loading: true,
	rows: [],
	columns,
};

export default {
	title: 'Key Metrics/WidgetTiles/MetricTileTable',
	component: MetricTileTable,
};
