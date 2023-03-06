/**
 * Optimize SetupMain component stories.
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
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';
import {
	provideModuleRegistrations,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { Cell, Grid, Row } from '../../../../material-components';
import SetupMain from './SetupMain';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template() {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<SetupMain />
						</Cell>
					</Row>
				</Grid>
			</section>
		</div>
	);
}

export const WithPermissionError = Template.bind( null );
WithPermissionError.storyName = 'With permission non-retryable error';
WithPermissionError.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_OPTIMIZE ).receiveError(
				{
					code: 'test-error-code',
					message: 'Test error message',
					data: {
						reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
					},

					storeName: MODULES_OPTIMIZE,
				},
				'receiveGetAccounts',
				[]
			);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Optimize/Setup/SetupForm',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
