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
import Data from 'googlesitekit-data';
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

const { useSelect } = Data;

function ReportErrorWrapper( { ...args } ) {
	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrors()
	);

	return <ReportError error={ error } { ...args } />;
}

function Template( { setupRegistry = async () => {}, viewContext, ...args } ) {
	const setupRegistryCallback = async ( registry ) => {
		provideModules( registry );
		provideModuleRegistrations( registry );
		await registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
		await setupRegistry( registry );
	};
	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<ReportErrorWrapper moduleSlug="analytics" { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

function PlainTemplate( { ...args } ) {
	return <ReportError { ...args } />;
}

export const DefaultReportError = Template.bind( {} );
DefaultReportError.storyName = 'Default ReportError';
DefaultReportError.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {},
			},
			'getAccountID'
		);
	},
};

export const ReportErrorWithHTMLTags = Template.bind( {} );
ReportErrorWithHTMLTags.storyName = 'ReportError with HTML tags';
ReportErrorWithHTMLTags.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message:
					'<h1>Test error message with <strong>HTML</strong> tags</h1>',
				data: {},
			},
			'getAccountID'
		);
	},
};

export const ReportErrorWithInsufficientPermissions = Template.bind( {} );
ReportErrorWithInsufficientPermissions.storyName =
	'ReportError with insufficient permissions';
ReportErrorWithInsufficientPermissions.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
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

export const ReportErrorWithInsufficientPermissionsWithRequestAccess =
	Template.bind( {} );
ReportErrorWithInsufficientPermissionsWithRequestAccess.storyName =
	'ReportError with insufficient permissions with request access';
ReportErrorWithInsufficientPermissionsWithRequestAccess.args = {
	moduleSlug: 'analytics',
	setupRegistry: async ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics',
			},
		] );

		const [ accountID, internalWebPropertyID, profileID ] = [
			'12345',
			'34567',
			'56789',
		];

		await registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );
		await registry
			.dispatch( MODULES_ANALYTICS )
			.setInternalWebPropertyID( internalWebPropertyID );
		await registry.dispatch( MODULES_ANALYTICS ).setProfileID( profileID );
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
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

export const ReportErrorWithInsufficientPermissionsForViewOnlyUser =
	Template.bind( {} );
ReportErrorWithInsufficientPermissionsForViewOnlyUser.storyName =
	'ReportError with insufficient permissions for view-only user';
ReportErrorWithInsufficientPermissionsForViewOnlyUser.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
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
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const ReportErrorWithRetryButton = Template.bind( {} );
ReportErrorWithRetryButton.storyName = 'ReportError with Retry Button';
ReportErrorWithRetryButton.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: 'Data Error',
				},
			},
			'getReport',
			[
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const MultipleReportErrorsWithRetryButton = Template.bind( {} );
MultipleReportErrorsWithRetryButton.storyName =
	'Multiple Report Errors with Retry Button';
MultipleReportErrorsWithRetryButton.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message one',
				data: {
					reason: 'Data Error',
				},
			},
			'getReport',
			[
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message two',
				data: {
					reason: 'Data Error',
				},
			},
			'getReport',
			[
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message three',
				data: {
					reason: 'Data Error',
				},
			},
			'getReport',
			[
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);
	},
};

export const MultipleUniqueReportErrorsWithRetryButtonWith = Template.bind(
	{}
);
MultipleUniqueReportErrorsWithRetryButtonWith.storyName =
	'Multiple Unique Report Errors with Retry Button';
MultipleUniqueReportErrorsWithRetryButtonWith.args = {
	setupRegistry: async ( registry ) => {
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: 'Data Error',
				},
			},
			'getReport',
			[
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);
		await registry.dispatch( MODULES_ANALYTICS ).receiveError(
			{
				code: 'test-error-code',
				message: 'Test error message',
				data: {
					reason: 'Data Error',
				},
			},
			'getReport',
			[
				{
					dimensions: [ 'ga:date' ],
					metrics: [ { expression: 'ga:users' } ],
					startDate: '2020-08-11',
					endDate: '2020-09-07',
				},
			]
		);
	},
};

export const ReportErrorWithCustomInternalServerErrorMessage =
	PlainTemplate.bind( {} );
ReportErrorWithCustomInternalServerErrorMessage.storyName =
	'ReportError with custom Internal Server Error message';
ReportErrorWithCustomInternalServerErrorMessage.args = {
	error: {
		code: 'internal_server_error',
		message: 'Test error message',
	},
};

export const ReportErrorWithCustomInvalidJSONMessage = PlainTemplate.bind( {} );
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
