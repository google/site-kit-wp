/**
 * InviteUserRow Component Stories.
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
import InviteUserRow from './InviteUserRow';

const mockUser = {
	id: 2,
	displayName: 'MainAdminName',
	name: 'MainAdminName',
	email: 'someone@anybusiness.com',
	role: 'administrator',
	subscribed: false,
};

function Template( { user, inviteResult, ...args } ) {
	return (
		<div
			style={ {
				maxWidth: '400px',
				padding: '16px',
				backgroundColor: '#fff',
			} }
		>
			<InviteUserRow
				user={ user }
				inviteResult={ inviteResult }
				onInviteResult={ () => {} }
				{ ...args }
			/>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default State';
Default.args = {
	user: mockUser,
};
Default.scenario = {};

export const Success = Template.bind( {} );
Success.storyName = 'Success State';
Success.args = {
	user: mockUser,
	inviteResult: { status: 'success' },
};
Success.scenario = {};

export const Error = Template.bind( {} );
Error.storyName = 'Error State';
Error.args = {
	user: mockUser,
	inviteResult: { status: 'error', message: 'Failed to send invitation' },
};
Error.scenario = {};

export default {
	title: 'Components/EmailReporting/InviteUserRow',
	component: InviteUserRow,
};
