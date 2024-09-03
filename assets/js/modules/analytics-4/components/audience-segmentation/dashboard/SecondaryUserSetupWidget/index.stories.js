/**
 * SecondaryUserSetupWidget Component Stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies.
 */
import SecondaryUserSetupWidgetWidget from '.';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';

const userAuthenticationEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/authentication'
);
const syncAvailableAudiencesEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
);

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsAudienceSecondaryUserSetup'
)( SecondaryUserSetupWidgetWidget );

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

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/SecondaryUserSetupWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = async ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );
				provideModuleRegistrations( registry );

				const audienceSettings = {
					configuredAudiences: null,
					isAudienceSegmentationWidgetHidden: false,
				};

				registry
					.dispatch( CORE_USER )
					.receiveGetAudienceSettings( audienceSettings );

				await args?.setupRegistry( registry );
			};
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
