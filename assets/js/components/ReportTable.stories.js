/**
 * ReportTable Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import ReportTable from './ReportTable';
import Layout from './layout/Layout';
import Link from './Link';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	WithTestRegistry,
} from '../../../tests/js/utils';
import NewBadge from './NewBadge';

const Template = ( args ) => <ReportTable { ...args } />;

export const ReportTableBasic = Template.bind( {} );
ReportTableBasic.storyName = 'Basic';
ReportTableBasic.decorators = [
	( Story, { args } ) => {
		const registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
		const modules = registry.select( CORE_MODULES ).getModules();
		args.rows = Object.values( modules );
		args.columns = [
			{
				title: 'Name',
				description: 'Module name',
				primary: true,
				Component: ( { row } ) => (
					<Link
						href={ row.homepage }
						children={ row.name }
						external
					/>
				),
			},
			{
				title: 'Description',
				description: 'Module description',
				field: 'description',
			},
			{
				title: 'Icon',
				Component: ( { row } ) => row.Icon && <row.Icon width={ 33 } />,
			},
		];

		return <Story />;
	},
];

export const ReportTableGatheringData = Template.bind( {} );
ReportTableGatheringData.storyName = 'Gathering Data';
ReportTableGatheringData.args = {
	rows: [],
	columns: [
		{
			title: 'Top search queries for your site',
			primary: true,
			field: 'queries',
		},
		{
			title: 'Impressions',
			description: 'Impressions description',
			field: 'impressions',
		},
		{
			title: 'Clicks',
			field: 'clicks',
		},
	],
	gatheringData: true,
};

export const ReportTableWithNewBadge = Template.bind( {} );
ReportTableWithNewBadge.storyName = 'With New Badge';
ReportTableWithNewBadge.args = {
	rows: [],
	columns: [
		{
			title: 'Title 1',
			field: 'title1',
		},
		{
			title: 'Title 2',
			field: 'title2',
			badge: (
				<NewBadge
					tooltipTitle="Tooltip title for the badge in the table header."
					learnMoreLink="#"
				/>
			),
		},
		{
			title: 'Title 3',
			field: 'title3',
		},
	],
};

export default {
	title: 'Components/ReportTable',
	component: ReportTable,
	decorators: [
		( Story, { parameters } ) => {
			return (
				<WithTestRegistry features={ parameters.features || [] }>
					<Layout>
						<Story />
					</Layout>
				</WithTestRegistry>
			);
		},
	],
};
