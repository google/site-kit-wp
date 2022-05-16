/**
 * ModuleRecoveryAlert Component Stories.
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
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteConnection,
	provideSiteInfo,
	provideUserAuthentication,
	WithTestRegistry,
} from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { VIEW_CONTEXT_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import ModuleRecoveryAlert from './ModuleRecoveryAlert';

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<ViewContextProvider value={ VIEW_CONTEXT_DASHBOARD }>
			<ModuleRecoveryAlert { ...args } />
		</ViewContextProvider>
	</WithRegistrySetup>
);

export const LoadingRecoverableModules = Template.bind( {} );
LoadingRecoverableModules.storyName = 'Loading Recoverable Modules';
LoadingRecoverableModules.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveRecoverableModules( [ 'search-console' ] );
	},
};
LoadingRecoverableModules.scenario = {
	label: 'Global/ModuleRecoveryAlert/Loading Recoverable Modules',
	delay: 250,
};

export const SingleRecoverableModule = Template.bind( {} );
SingleRecoverableModule.storyName = 'Single Recoverable Module (with access)';
SingleRecoverableModule.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveRecoverableModules( [ 'search-console' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: 'search-console' }
			);
	},
};
SingleRecoverableModule.scenario = {
	label: 'Global/ModuleRecoveryAlert/Single Recoverable Module (with access)',
	delay: 250,
};

export const MultipleRecoverableModule = Template.bind( {} );
MultipleRecoverableModule.storyName =
	'Multiple Recoverable Modules (with access)';
MultipleRecoverableModule.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveRecoverableModules( [ 'search-console', 'analytics' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: 'search-console' }
			);
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: 'analytics' }
			);
	},
};
MultipleRecoverableModule.scenario = {
	label:
		'Global/ModuleRecoveryAlert/Multiple Recoverable Modules (with access)',
	delay: 250,
};

export const SingleRecoverableModuleNoAccess = Template.bind( {} );
SingleRecoverableModuleNoAccess.storyName =
	'Single Recoverable Module (no access)';
SingleRecoverableModuleNoAccess.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveRecoverableModules( [ 'search-console' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'search-console' }
			);
	},
};
SingleRecoverableModuleNoAccess.scenario = {
	label: 'Global/ModuleRecoveryAlert/Single Recoverable Module (no access)',
	delay: 250,
};

export const MultipleRecoverableModuleNoAccess = Template.bind( {} );
MultipleRecoverableModuleNoAccess.storyName =
	'Multiple Recoverable Modules (no access)';
MultipleRecoverableModuleNoAccess.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveRecoverableModules( [ 'search-console', 'analytics' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'search-console' }
			);
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'analytics' }
			);
	},
};
MultipleRecoverableModuleNoAccess.scenario = {
	label:
		'Global/ModuleRecoveryAlert/Multiple Recoverable Modules (no access)',
	delay: 250,
};

export default {
	title: 'Components/ModuleRecoveryAlert',
	component: ModuleRecoveryAlert,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideUserAuthentication( registry );
			provideSiteInfo( registry );
			provideSiteConnection( registry );
			provideModules( registry );
			provideModuleRegistrations( registry );

			return (
				<WithTestRegistry
					registry={ registry }
					features={ [ 'dashboardSharing' ] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
