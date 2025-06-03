/**
 * ModuleRecoveryAlert Component Stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import { provideModules } from '../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../googlesitekit/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { Provider as ViewContextProvider } from '../../Root/ViewContextContext';
import { withNotificationComponentProps } from '../../../googlesitekit/notifications/util/component-props';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import ModuleRecoveryAlert from '.';

const NotificationWithComponentProps = withNotificationComponentProps(
	'module-recovery-alert'
)( ModuleRecoveryAlert );

function Template( { setupRegistry = () => {} } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<NotificationWithComponentProps />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

const provideModulesWithRecoverable = ( registry, recoverableModules ) => {
	provideModules(
		registry,
		recoverableModules.map( ( slug ) => ( { slug, recoverable: true } ) )
	);
};

export const LoadingRecoverableModules = Template.bind( {} );
LoadingRecoverableModules.storyName = 'Loading Recoverable Modules';
LoadingRecoverableModules.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );
		registry
			.dispatch( CORE_MODULES )
			.startResolution( 'getRecoverableModules', [] );
	},
};
LoadingRecoverableModules.scenario = {};

export const SingleRecoverableModule = Template.bind( {} );
SingleRecoverableModule.storyName = 'Single Recoverable Module (with access)';
SingleRecoverableModule.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [
			MODULE_SLUG_SEARCH_CONSOLE,
		] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_SEARCH_CONSOLE }
			);
	},
};
SingleRecoverableModule.scenario = {};

export const MultipleRecoverableModule = Template.bind( {} );
MultipleRecoverableModule.storyName =
	'Multiple Recoverable Modules (with access)';
MultipleRecoverableModule.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [
			MODULE_SLUG_SEARCH_CONSOLE,
			MODULE_SLUG_ANALYTICS_4,
		] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_SEARCH_CONSOLE }
			);
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_ANALYTICS_4 }
			);
	},
};
MultipleRecoverableModule.scenario = {};

export const SingleRecoverableModuleNoAccess = Template.bind( {} );
SingleRecoverableModuleNoAccess.storyName =
	'Single Recoverable Module (no access)';
SingleRecoverableModuleNoAccess.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [
			MODULE_SLUG_SEARCH_CONSOLE,
		] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: MODULE_SLUG_SEARCH_CONSOLE }
			);
	},
};
SingleRecoverableModuleNoAccess.scenario = {};

export const MultipleRecoverableModuleNoAccess = Template.bind( {} );
MultipleRecoverableModuleNoAccess.storyName =
	'Multiple Recoverable Modules (no access)';
MultipleRecoverableModuleNoAccess.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [
			MODULE_SLUG_SEARCH_CONSOLE,
			MODULE_SLUG_ANALYTICS_4,
		] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: MODULE_SLUG_SEARCH_CONSOLE }
			);
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: MODULE_SLUG_ANALYTICS_4 }
			);
	},
};
MultipleRecoverableModuleNoAccess.scenario = {};

export const SingleRecoverableModuleError = Template.bind( {} );
SingleRecoverableModuleError.storyName =
	'Single Recoverable Module with Error Message';
SingleRecoverableModuleError.args = {
	setupRegistry: ( registry ) => {
		const response = {
			success: {
				MODULE_SLUG_SEARCH_CONSOLE: false,
			},
			error: {
				MODULE_SLUG_SEARCH_CONSOLE: {
					code: 'module_not_recoverable',
					message: 'Module is not recoverable.',
					data: { status: 403 },
				},
			},
		};

		fetchMock.post(
			new RegExp(
				'^/google-site-kit/v1/core/modules/data/recover-modules'
			),
			{ body: response, status: 200 }
		);

		provideModulesWithRecoverable( registry, [
			MODULE_SLUG_SEARCH_CONSOLE,
		] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_SEARCH_CONSOLE }
			);
		registry
			.dispatch( CORE_MODULES )
			.recoverModules( [ MODULE_SLUG_SEARCH_CONSOLE ] );
	},
};

export const MultipleRecoverableModuleErrors = Template.bind( {} );
MultipleRecoverableModuleErrors.storyName =
	'Multiple Recoverable Modules with Error Messages';
MultipleRecoverableModuleErrors.args = {
	setupRegistry: ( registry ) => {
		const response = {
			success: {
				MODULE_SLUG_SEARCH_CONSOLE: false,
				analytics: false,
			},
			error: {
				MODULE_SLUG_SEARCH_CONSOLE: {
					code: 'module_not_recoverable',
					message: 'Module is not recoverable.',
					data: { status: 403 },
				},
				analytics: {
					code: 'module_not_recoverable',
					message: 'Module is not recoverable.',
					data: { status: 403 },
				},
			},
		};

		fetchMock.post(
			new RegExp(
				'^/google-site-kit/v1/core/modules/data/recover-modules'
			),
			{ body: response, status: 200 }
		);

		provideModulesWithRecoverable( registry, [
			MODULE_SLUG_SEARCH_CONSOLE,
			MODULE_SLUG_ANALYTICS_4,
		] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_SEARCH_CONSOLE }
			);
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_ANALYTICS_4 }
			);
		registry
			.dispatch( CORE_MODULES )
			.recoverModules( [
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULE_SLUG_ANALYTICS_4,
			] );
	},
};

export default {
	title: 'Components/ModuleRecoveryAlert',
	component: ModuleRecoveryAlert,
};
