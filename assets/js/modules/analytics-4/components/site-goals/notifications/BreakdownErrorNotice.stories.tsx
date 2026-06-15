/**
 * Site Goals BreakdownErrorNotice stories.
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
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import BreakdownErrorNotice from './BreakdownErrorNotice';

const GENERIC_ERROR = {
	code: 'internal_server_error',
	message: 'Internal server error',
	data: { status: 500 },
};

const PERMISSIONS_ERROR = {
	code: 'insufficient_permissions',
	message: 'Insufficient permissions',
	data: { status: 403, reason: 'insufficientPermissions' },
};

interface BreakdownErrorNoticeStoryProps {
	error: typeof GENERIC_ERROR;
	permissionsTitle: string;
}

function Template( {
	error,
	permissionsTitle,
}: BreakdownErrorNoticeStoryProps ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => provideSiteInfo( registry ) }
		>
			<BreakdownErrorNotice
				error={ error }
				permissionsTitle={ permissionsTitle }
				onRetry={ () => {} }
				onDismiss={ () => {} }
			/>
		</WithRegistrySetup>
	);
}

export const Generic = Template.bind(
	{}
) as Story< BreakdownErrorNoticeStoryProps >;
Generic.storyName = 'Generic';
Generic.args = {
	error: GENERIC_ERROR,
	permissionsTitle: 'Individual form tracking setup failed',
};

export const Permissions = Template.bind(
	{}
) as Story< BreakdownErrorNoticeStoryProps >;
Permissions.storyName = 'Insufficient permissions';
Permissions.args = {
	error: PERMISSIONS_ERROR,
	permissionsTitle: 'Individual form tracking setup failed',
};

export default {
	title: 'Modules/Analytics4/Components/Site Goals/Notifications/BreakdownErrorNotice',
	component: BreakdownErrorNotice,
};
