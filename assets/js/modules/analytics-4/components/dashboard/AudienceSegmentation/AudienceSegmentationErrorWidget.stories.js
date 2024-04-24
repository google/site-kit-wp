/**
 * AudienceSegmentationErrorWidget Component Stories.
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
import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideUserInfo,
} from '../../../../../../../tests/js/test-utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import AudienceSegmentationErrorWidget from './AudienceSegmentationErrorWidget';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../util/errors';

const { useSelect } = Data;

const WidgetWithComponentProps = withWidgetComponentProps(
	'audienceSegmentationErrorWidget'
)( AudienceSegmentationErrorWidget );

function AudienceErrorWidgetWrapper( { ...args } ) {
	const errors = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrors()
	);

	return <WidgetWithComponentProps errors={ errors } { ...args } />;
}

function Template( { setupRegistry = async () => {}, ...args } ) {
	const setupRegistryCallback = async ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );
		provideUserInfo( registry );
		await setupRegistry( registry );
	};
	return (
		<WithRegistrySetup func={ setupRegistryCallback }>
			<AudienceErrorWidgetWrapper { ...args } />
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
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceSegmentationErrorWidget/Default',
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'InsufficientPermissions';
InsufficientPermissions.args = {
	setupRegistry: async ( registry ) => {
		const [ accountID, propertyID, measurementID, webDataStreamID ] = [
			'12345',
			'34567',
			'56789',
			'78901',
		];

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAccountID( accountID );
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyID( propertyID );
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setMeasurementID( measurementID );
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setWebDataStreamID( webDataStreamID );
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
	label: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceSegmentationErrorWidget/InsufficientPermissions',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/AudienceSegmentationErrorWidget',
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();

			return (
				<div
					style={ {
						minHeight: '200px',
						display: 'flex',
						alignItems: 'center',
					} }
				>
					<div id="adminmenu">
						{ /* eslint-disable-next-line jsx-a11y/anchor-has-content */ }
						<a href="http://test.test/?page=googlesitekit-settings" />
					</div>
					<div style={ { flex: 1 } }>
						<WithTestRegistry registry={ registry }>
							<Story />
						</WithTestRegistry>
					</div>
				</div>
			);
		},
	],
};
