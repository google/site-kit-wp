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
import { Provider as ViewContextProvider } from '../../Root/ViewContextContext';
import { withNotificationComponentProps } from '../../../googlesitekit/notifications/util/component-props';
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
LoadingRecoverableModules.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	label: 'Global/ModuleRecoveryAlert/Loading Recoverable Modules',
	delay: 250,
};

export const SingleRecoverableModule = Template.bind( {} );
SingleRecoverableModule.storyName = 'Single Recoverable Module (with access)';
SingleRecoverableModule.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [ 'search-console' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: 'search-console' }
			);
	},
};
SingleRecoverableModule.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	label: 'Global/ModuleRecoveryAlert/Single Recoverable Module (with access)',
	delay: 250,
};

export const MultipleRecoverableModule = Template.bind( {} );
MultipleRecoverableModule.storyName =
	'Multiple Recoverable Modules (with access)';
MultipleRecoverableModule.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [
			'search-console',
			'analytics-4',
		] );
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
				{ slug: 'analytics-4' }
			);
	},
};
MultipleRecoverableModule.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	label: 'Global/ModuleRecoveryAlert/Multiple Recoverable Modules (with access)',
	delay: 250,
};

export const SingleRecoverableModuleNoAccess = Template.bind( {} );
SingleRecoverableModuleNoAccess.storyName =
	'Single Recoverable Module (no access)';
SingleRecoverableModuleNoAccess.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [ 'search-console' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: 'search-console' }
			);
	},
};
SingleRecoverableModuleNoAccess.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	label: 'Global/ModuleRecoveryAlert/Single Recoverable Module (no access)',
	delay: 250,
};

export const MultipleRecoverableModuleNoAccess = Template.bind( {} );
MultipleRecoverableModuleNoAccess.storyName =
	'Multiple Recoverable Modules (no access)';
MultipleRecoverableModuleNoAccess.args = {
	setupRegistry: ( registry ) => {
		provideModulesWithRecoverable( registry, [
			'search-console',
			'analytics-4',
		] );
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
				{ slug: 'analytics-4' }
			);
	},
};
MultipleRecoverableModuleNoAccess.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	label: 'Global/ModuleRecoveryAlert/Multiple Recoverable Modules (no access)',
	delay: 250,
};

export const SingleRecoverableModuleError = Template.bind( {} );
SingleRecoverableModuleError.storyName =
	'Single Recoverable Module with Error Message';
SingleRecoverableModuleError.args = {
	setupRegistry: ( registry ) => {
		const response = {
			success: {
				'search-console': false,
			},
			error: {
				'search-console': {
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

		provideModulesWithRecoverable( registry, [ 'search-console' ] );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: 'search-console' }
			);
		registry
			.dispatch( CORE_MODULES )
			.recoverModules( [ 'search-console' ] );
	},
};

export const MultipleRecoverableModuleErrors = Template.bind( {} );
MultipleRecoverableModuleErrors.storyName =
	'Multiple Recoverable Modules with Error Messages';
MultipleRecoverableModuleErrors.args = {
	setupRegistry: ( registry ) => {
		const response = {
			success: {
				'search-console': false,
				analytics: false,
			},
			error: {
				'search-console': {
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
			'search-console',
			'analytics-4',
		] );
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
				{ slug: 'analytics-4' }
			);
		registry
			.dispatch( CORE_MODULES )
			.recoverModules( [ 'search-console', 'analytics-4' ] );
	},
};

export default {
	title: 'Components/ModuleRecoveryAlert',
	component: ModuleRecoveryAlert,
};
