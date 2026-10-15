/**
 * FeatureSetupErrorNotice stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import { Story } from '@/js/types/Story';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureSetupErrorNotice from './FeatureSetupErrorNotice';

interface StoryArgs {
	error: {
		code: string;
		message: string;
		data?: Record< string, unknown >;
	};
	isRetrying?: boolean;
}

function setupRegistry( registry: WPDataRegistry ) {
	provideSiteInfo( registry );
	provideFeatures( registry, [
		{
			slug: 'test-feature',
			title: 'Analytics',
		},
	] );
}

function Template( { error, isRetrying = false }: StoryArgs ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<FeatureSetupErrorNotice
				error={ error }
				isRetrying={ isRetrying }
				onDismiss={ () => {} }
				onRetry={ () => {} }
				slug="test-feature"
			/>
		</WithRegistrySetup>
	);
}

export const RetryableError = Template.bind( {} ) as Story< StoryArgs >;
RetryableError.storyName = 'Retryable error';
RetryableError.args = {
	error: {
		code: 'activation_failed',
		message: 'Could not activate service.',
		data: { status: 500 },
	},
};

export const InsufficientPermissions = Template.bind(
	{}
) as Story< StoryArgs >;
InsufficientPermissions.storyName = 'Insufficient permissions';
InsufficientPermissions.args = {
	error: {
		code: 'forbidden',
		message: 'Insufficient permissions.',
		data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
	},
};

export const ReconnectRequired = Template.bind( {} ) as Story< StoryArgs >;
ReconnectRequired.storyName = 'Reconnect required';
ReconnectRequired.args = {
	error: {
		code: 'access_denied',
		message: 'Authentication failed.',
		data: {
			reconnectURL: 'https://example.com/reconnect',
		},
	},
};

export default {
	title: 'Components/Feature Discovery/FeatureSetupErrorNotice',
	component: FeatureSetupErrorNotice,
};
