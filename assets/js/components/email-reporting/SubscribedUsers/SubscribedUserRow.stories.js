/**
 * SubscribedUserRow Component Stories.
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
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SubscribedUserRow from './SubscribedUserRow';

const mockUser = {
	id: 2,
	name: 'MainAdminName',
	email: 'someone@anybusiness.com',
	role: 'administrator',
};

function Template( { ...args } ) {
	function setupRegistry( registry ) {
		if ( args?.setupRegistry ) {
			args.setupRegistry( registry );
		}
	}

	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				style={ {
					maxWidth: '600px',
					padding: '24px',
					backgroundColor: '#fff',
				} }
			>
				<SubscribedUserRow user={ mockUser } />
			</div>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default State';

export const Success = Template.bind( {} );
Success.storyName = 'Success State';
Success.args = {
	// Mirrors what `unsubscribeUser` does on a real success: seed the cache
	// so the reducer can find the user, then run the same fetch-store
	// reducer a real unsubscribe would, which snapshots them into
	// `justUnsubscribedUsers`.
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetSubscribedUsers(
				{ users: [ mockUser ], total: 1, totalPages: 1 },
				{ page: 1, search: '' }
			);
		registry
			.dispatch( CORE_SITE )
			.receiveUnsubscribeUser(
				{ success: true },
				{ userID: mockUser.id }
			);
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error State';
Error.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.setErrorForAction(
				{ code: 'error', message: 'Failed to unsubscribe user' },
				'unsubscribeUser',
				[ mockUser.id ]
			);
	},
};

export default {
	title: 'Components/EmailReporting/SubscribedUserRow',
	component: SubscribedUserRow,
};
