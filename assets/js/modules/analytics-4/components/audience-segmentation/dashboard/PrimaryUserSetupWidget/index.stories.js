/**
 * PrimaryUserSetupWidget Component Stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies.
 */
import PrimaryUserSetupWidget from '.';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import {
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { availableAudiences } from '@/js/modules/analytics-4/datastore/__fixtures__';

const userAuthenticationEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/authentication'
);
const syncAvailableAudiencesEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
);

const createAudienceEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
);

const syncAvailableCustomDimensionsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
);

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsAudiencePrimaryUserSetup'
)( PrimaryUserSetupWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const SetupInProgress = Template.bind( {} );
SetupInProgress.storyName = 'Setup in progress';
SetupInProgress.args = {
	setupRegistry: () => {
		freezeFetch( userAuthenticationEndpoint );
	},
};

export const InsufficientPermissionError = Template.bind( {} );
InsufficientPermissionError.storyName = 'Insufficient permission error';
InsufficientPermissionError.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		const errorResponse = {
			code: 'test_error',
			message: 'Error message.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		fetchMock.post( syncAvailableAudiencesEndpoint, {
			body: errorResponse,
			status: 500,
		} );
	},
};

export const SetupError = Template.bind( {} );
SetupError.storyName = 'Setup error';
SetupError.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		const errorResponse = {
			code: 'test_error',
			message: 'Error message.',
			data: { status: 500 },
		};

		fetchMock.post( syncAvailableAudiencesEndpoint, {
			body: errorResponse,
			status: 500,
		} );
	},
};

export const FailedAudience = Template.bind( {} );
FailedAudience.storyName = 'Failed audience';
FailedAudience.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, {
			grantedScopes: EDIT_SCOPE,
		} );
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			body: availableAudiences.slice( 0, 2 ),
			status: 200,
		} );

		fetchMock.postOnce( syncAvailableCustomDimensionsEndpoint, {
			body: [ 'googlesitekit_post_author' ],
			status: 200,
		} );

		const errorResponse = {
			code: 'test_error',
			message: 'Error message.',
			data: { status: 500 },
		};

		fetchMock.postOnce( createAudienceEndpoint, {
			body: errorResponse,
			status: 500,
		} );
	},
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/PrimaryUserSetupWidget',
	decorators: [
		( Story, { args } ) => {
			async function setupRegistry( registry ) {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: MODULE_SLUG_ANALYTICS_4,
					},
				] );
				provideModuleRegistrations( registry );

				const [
					accountID,
					propertyID,
					measurementID,
					webDataStreamID,
				] = [ '12345', '34567', '56789', '78901' ];

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

				const audienceSettings = {
					configuredAudiences: null,
					isAudienceSegmentationWidgetHidden: false,
				};

				await registry
					.dispatch( CORE_USER )
					.receiveGetUserAudienceSettings( audienceSettings );

				await args?.setupRegistry( registry );
			}
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
