/**
 * Report Table component stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import ReportTable from '../assets/js/components/ReportTable';
import Layout from '../assets/js/components/layout/Layout';
import Link from '../assets/js/components/Link';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';

storiesOf( 'Global/ReportTable', module )
	.add( 'Basic example – all modules', () => {
		const columns = [
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
		const registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
		const modules = registry.select( CORE_MODULES ).getModules();
		const rows = Object.values( modules );

		return (
			<Layout>
				<ReportTable
					rows={ rows }
					columns={ columns }
				/>
			</Layout>
		);
	} )
;
