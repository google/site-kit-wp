/**
 * Report Error Component Stories.
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
import ReportError from './ReportError';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from './Root/ViewContextContext';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../util/errors';
import { MODULES_ANALYTICS } from '../modules/analytics/datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<ReportError moduleSlug="test-module" { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const DefaultReportError = Template.bind( {} );
DefaultReportError.storyName = 'Default ReportError';
DefaultReportError.args = {
	error: {
		code: 'test-error-code',
		message: 'Test error message',
		data: {},
	},
};

export const ReportErrorWithHTMLTags = Template.bind( {} );
ReportErrorWithHTMLTags.storyName = 'ReportError with HTML tags';
ReportErrorWithHTMLTags.args = {
	error: {
		code: 'test-error-code',
		message: '<h1>Test error message with <strong>HTML</strong> tags</h1>',
		data: {},
	},
};

export const ReportErrorWithInsufficientPermissions = Template.bind( {} );
ReportErrorWithInsufficientPermissions.storyName =
	'ReportError with insufficient permissions';
ReportErrorWithInsufficientPermissions.args = {
	error: {
		code: 'test-error-code',
		message: 'Test error message',
		data: {
			reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		},
	},
};

export const ReportErrorWithInsufficientPermissionsWithRequestAccess =
	Template.bind( {} );
ReportErrorWithInsufficientPermissionsWithRequestAccess.storyName =
	'ReportError with insufficient permissions with request access';
ReportErrorWithInsufficientPermissionsWithRequestAccess.args = {
	error: {
		code: 'test-error-code',
		message: 'Test error message',
		data: {
			reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		},
	},
	moduleSlug: 'analytics',
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics',
			},
		] );
		provideModuleRegistrations( registry );

		const [ accountID, internalWebPropertyID, profileID ] = [
			'12345',
			'34567',
			'56789',
		];

		registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
		registry
			.dispatch( MODULES_ANALYTICS )
			.setInternalWebPropertyID( internalWebPropertyID );
		registry.dispatch( MODULES_ANALYTICS ).setProfileID( profileID );
	},
};

export const ReportErrorWithInsufficientPermissionsForViewOnlyUser =
	Template.bind( {} );
ReportErrorWithInsufficientPermissionsForViewOnlyUser.storyName =
	'ReportError with insufficient permissions for view-only user';
ReportErrorWithInsufficientPermissionsForViewOnlyUser.args = {
	error: {
		code: 'test-error-code',
		message: 'Test error message',
		data: {
			reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		},
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const ReportErrorWithRetryButton = Template.bind( {} );
ReportErrorWithRetryButton.storyName = 'ReportError with Retry Button';
ReportErrorWithRetryButton.args = {
	error: {
		code: 'test-error-code',
		message: 'Test error message',
		data: {
			reason: 'Data Error',
		},
		selectorData: {
			args: [
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			],
			name: 'getReport',
			storeName: MODULES_ANALYTICS,
		},
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const MultipleReportErrorsWithRetryButton = Template.bind( {} );
MultipleReportErrorsWithRetryButton.storyName =
	'Multiple Report Errors with Retry Button';
MultipleReportErrorsWithRetryButton.args = {
	error: [
		{
			code: 'test-error-code',
			message: 'Test error message one',
			data: {
				reason: 'Data Error',
			},
			selectorData: {
				args: [
					{
						dimensions: [ 'ga:date' ],
						metrics: [ { expression: 'ga:users' } ],
						startDate: '2020-08-11',
						endDate: '2020-09-07',
					},
				],
				name: 'getReport',
				storeName: MODULES_ANALYTICS,
			},
		},
		{
			code: 'test-error-code',
			message: 'Test error message two',
			data: {
				reason: 'Data Error',
			},
			selectorData: {
				args: [
					{
						dimensions: [ 'ga:date' ],
						metrics: [ { expression: 'ga:users' } ],
						startDate: '2020-08-11',
						endDate: '2020-09-07',
					},
				],
				name: 'getReport',
				storeName: MODULES_ANALYTICS,
			},
		},
		{
			code: 'test-error-code',
			message: 'Test error message three',
			data: {
				reason: 'Data Error',
			},
			selectorData: {
				args: [
					{
						dimensions: [ 'ga:date' ],
						metrics: [ { expression: 'ga:users' } ],
						startDate: '2020-08-11',
						endDate: '2020-09-07',
					},
				],
				name: 'getReport',
				storeName: MODULES_ANALYTICS,
			},
		},
	],
};

export const MultipleUniqueReportErrorsWithRetryButtonWith = Template.bind(
	{}
);
MultipleUniqueReportErrorsWithRetryButtonWith.storyName =
	'Multiple Unique Report Errors with Retry Button';
MultipleUniqueReportErrorsWithRetryButtonWith.args = {
	error: [
		{
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'Data Error',
			},
			selectorData: {
				args: [
					{
						dimensions: [ 'ga:date' ],
						metrics: [ { expression: 'ga:users' } ],
						startDate: '2020-08-11',
						endDate: '2020-09-07',
					},
				],
				name: 'getReport',
				storeName: MODULES_ANALYTICS,
			},
		},
		{
			code: 'test-error-code',
			message: 'Test error message',
			data: {
				reason: 'Data Error',
			},
			selectorData: {
				args: [
					{
						dimensions: [ 'ga:date' ],
						metrics: [ { expression: 'ga:users' } ],
						startDate: '2020-08-11',
						endDate: '2020-09-07',
					},
				],
				name: 'getReport',
				storeName: MODULES_ANALYTICS,
			},
		},
	],
};

export const ReportErrorWithCustomInternalServerErrorMessage = Template.bind(
	{}
);
ReportErrorWithCustomInternalServerErrorMessage.storyName =
	'ReportError with custom Internal Server Error message';
ReportErrorWithCustomInternalServerErrorMessage.args = {
	error: {
		code: 'internal_server_error',
		message: 'Test error message',
	},
};

export const ReportErrorWithCustomInvalidJSONMessage = Template.bind( {} );
ReportErrorWithCustomInvalidJSONMessage.storyName =
	'ReportError with custom Invalid JSON message';
ReportErrorWithCustomInvalidJSONMessage.args = {
	error: {
		code: 'invalid_json',
		message: 'Test error message',
	},
};

export default {
	title: 'Components/ReportError',
	component: ReportError,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideModules( registry, [
				{ slug: 'test-module', name: 'Test Module' },
			] );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
