/**
 * TableTile Component Stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Story } from '@/js/types/Story';
import TableTile, { TableTileProps } from './TableTile';
import TileStoryCard from './TileStoryCard';

function Template( props: TableTileProps ) {
	return (
		<TileStoryCard>
			<TableTile { ...props } />
		</TileStoryCard>
	);
}

export const Default = Template.bind( {} ) as Story< TableTileProps >;
Default.args = {
	title: 'Top traffic channels',
	headerLabel: 'Visitors',
	rows: [
		{ label: 'Organic Search', value: '1,204' },
		{ label: 'Direct', value: '873' },
		{ label: 'Referral', value: '312' },
	],
};

export const SecondaryValues = Template.bind( {} ) as Story< TableTileProps >;
SecondaryValues.storyName = 'Secondary Values';
SecondaryValues.args = {
	title: 'Top traffic channels',
	headerLabel: 'Visitors',
	rows: [
		{ label: 'Organic Search', value: '1,204', secondaryValue: '50%' },
		{ label: 'Direct', value: '873', secondaryValue: '36%' },
		{ label: 'Referral', value: '312', secondaryValue: '13%' },
		{ label: 'Email', value: '9', secondaryValue: '<1%' },
	],
};
SecondaryValues.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Tiles/TableTile',
	component: TableTile,
};
