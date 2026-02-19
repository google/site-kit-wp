/**
 * InviteOthersToSubscribe Component Stories.
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
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import {
	provideUserCapabilities,
	provideUserInfo,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import InviteOthersToSubscribe from '.';
import InviteUserRow from './InviteUserRow';

const mockEligibleSubscribers = [
	{
		id: 2,
		displayName: 'MainAdminName',
		name: 'MainAdminName',
		email: 'someone@anybusiness.com',
		role: 'administrator',
		subscribed: false,
	},
	{
		id: 3,
		displayName: 'AdminName2',
		name: 'AdminName2',
		email: 'anotheradminname@anybusiness.com',
		role: 'administrator',
		subscribed: false,
	},
	{
		id: 4,
		displayName: 'AuthorName',
		name: 'AuthorName',
		email: 'admin2business@gmail.com',
		role: 'author',
		subscribed: false,
	},
];

const manyUsers = [
	...mockEligibleSubscribers,
	{
		id: 5,
		displayName: 'AuthorName22',
		name: 'AuthorName22',
		email: 'authorbusiness@gmail.com',
		role: 'author',
		subscribed: false,
	},
	{
		id: 6,
		displayName: 'EditorName',
		name: 'EditorName',
		email: 'editor@example.com',
		role: 'editor',
		subscribed: false,
	},
	{
		id: 7,
		displayName: 'ContributorName',
		name: 'ContributorName',
		email: 'contributor@example.com',
		role: 'contributor',
		subscribed: false,
	},
	{
		id: 8,
		displayName: 'AnotherEditor',
		name: 'AnotherEditor',
		email: 'anothereditor@example.com',
		role: 'editor',
		subscribed: false,
	},
];

function Template( { ...args } ) {
	return <InviteOthersToSubscribe isOpen { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default (3 users, no search)';
Default.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetEligibleSubscribers( mockEligibleSubscribers );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );
	},
};

export const WithSearch = Template.bind( {} );
WithSearch.storyName = 'With Search (7+ users)';
WithSearch.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetEligibleSubscribers( manyUsers );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );
	},
};

export const Empty = Template.bind( {} );
Empty.storyName = 'Empty State (no eligible users)';
Empty.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetEligibleSubscribers( [] );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getEligibleSubscribers', [] );
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading State';
Loading.args = {
	setupRegistry: () => {
		// Don't dispatch any eligible subscribers to simulate loading.
	},
};

// Individual InviteUserRow stories
function RowTemplate( { user, inviteResult, ...args } ) {
	return (
		<div style={ { maxWidth: '400px', padding: '16px' } }>
			<InviteUserRow
				user={ user }
				inviteResult={ inviteResult }
				onInviteResult={ () => {} }
				{ ...args }
			/>
		</div>
	);
}

export const UserRowDefault = RowTemplate.bind( {} );
UserRowDefault.storyName = 'User Row: Default State';
UserRowDefault.args = {
	user: mockEligibleSubscribers[ 0 ],
};

export const UserRowSuccess = RowTemplate.bind( {} );
UserRowSuccess.storyName = 'User Row: Success State';
UserRowSuccess.args = {
	user: mockEligibleSubscribers[ 0 ],
	inviteResult: { status: 'success' },
};

export const UserRowError = RowTemplate.bind( {} );
UserRowError.storyName = 'User Row: Error State';
UserRowError.args = {
	user: mockEligibleSubscribers[ 0 ],
	inviteResult: { status: 'error', message: 'Failed to send invitation' },
};

export default {
	title: 'Components/EmailReporting/InviteOthersToSubscribe',
	component: InviteOthersToSubscribe,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideUserCapabilities( registry );
				provideUserInfo( registry, { id: 1 } );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<div
						style={ {
							maxWidth: '400px',
							padding: '24px',
							backgroundColor: '#fff',
						} }
					>
						<Story />
					</div>
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		features: [ 'proactiveUserEngagement' ],
	},
};
