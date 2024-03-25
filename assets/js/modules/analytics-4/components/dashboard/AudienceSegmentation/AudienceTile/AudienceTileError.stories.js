/**
 * AudienceTileError Component Stories.
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
import Data from 'googlesitekit-data';
import AudienceTileError from './AudienceTileError';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../../../components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../../googlesitekit/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';

const { useSelect } = Data;

function AudienceTileErrorWrapper( { ...args } ) {
	const errors = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrors()
	);

	return <AudienceTileError errors={ errors } { ...args } />;
}

function Template( { setupRegistry = async () => {}, viewContext, ...args } ) {
	const setupRegistryCallback = async ( registry ) => {
		provideModules( registry );
		provideModuleRegistrations( registry );
		await registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		await setupRegistry( registry );
	};
	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<AudienceTileErrorWrapper { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {},
			},
			'getAccountID'
		);
	},
};
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTileError/Default',
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'InsufficientPermissions';
InsufficientPermissions.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS_4 ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
				},
			},
			'getAccountID'
		);
	},
};
InsufficientPermissions.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTileError/InsufficientPermissions',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceTileError',
	component: AudienceTileError,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
