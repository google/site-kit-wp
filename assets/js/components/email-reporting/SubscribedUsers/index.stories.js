/**
 * SubscribedUsers Component Stories.
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
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { provideUserCapabilities, provideUserInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SubscribedUsers from '.';

const mockSubscribedUsers = [
	{
		id: 2,
		name: 'MainAdminName',
		email: 'someone@anybusiness.com',
		role: 'administrator',
	},
	{
		id: 3,
		name: 'AdminName2',
		email: 'anotheradminname@anybusiness.com',
		role: 'administrator',
	},
	{
		id: 4,
		name: 'AuthorName',
		email: 'admin2business@gmail.com',
		role: 'author',
	},
];

const manyUsers = [
	...mockSubscribedUsers,
	{
		id: 5,
		name: 'AuthorName22',
		email: 'authorbusiness@gmail.com',
		role: 'author',
	},
	{
		id: 6,
		name: 'EditorName',
		email: 'editor@example.com',
		role: 'editor',
	},
	{
		id: 7,
		name: 'ContributorName',
		email: 'contributor@example.com',
		role: 'contributor',
	},
	{
		id: 8,
		name: 'AnotherEditor',
		email: 'anothereditor@example.com',
		role: 'editor',
	},
];

function Template( { ...args } ) {
	return <SubscribedUsers { ...args } />;
}

const defaultQueryArgs = { search: '' };

function createSubscribedUsersResponse( users ) {
	return {
		users,
		total: users.length,
		totalPages: 1,
	};
}

export const Default = Template.bind( {} );
Default.storyName = 'Default (3 users, no search)';
Default.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetSubscribedUsers(
				createSubscribedUsersResponse( mockSubscribedUsers ),
				{ page: 1, search: '' }
			);
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getSubscribedUsers', [ defaultQueryArgs ] );
	},
};

export const WithSearch = Template.bind( {} );
WithSearch.storyName = 'With Search (7+ users)';
WithSearch.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetSubscribedUsers(
				createSubscribedUsersResponse( manyUsers ),
				{ page: 1, search: '' }
			);
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getSubscribedUsers', [ defaultQueryArgs ] );
	},
};

export const Empty = Template.bind( {} );
Empty.storyName = 'Empty State (no subscribed users)';
Empty.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetSubscribedUsers( createSubscribedUsersResponse( [] ), {
				page: 1,
				search: '',
			} );
		registry
			.dispatch( CORE_SITE )
			.finishResolution( 'getSubscribedUsers', [ defaultQueryArgs ] );
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading State';
Loading.args = {
	setupRegistry: ( registry ) => {
		// Start resolution but never finish it so the component stays in loading state.
		registry
			.dispatch( CORE_SITE )
			.startResolution( 'getSubscribedUsers', [ defaultQueryArgs ] );
	},
};
Loading.decorators = [
	( Story ) => (
		<div className="googlesitekit-vrt-animation-paused">
			<Story />
		</div>
	),
];

export default {
	title: 'Components/EmailReporting/SubscribedUsers',
	component: SubscribedUsers,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideUserCapabilities( registry );
				provideUserInfo( registry, { id: 1 } );
				registry
					.dispatch( CORE_UI )
					.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<div
						style={ {
							display: 'flex',
							flexDirection: 'column',
							maxWidth: '600px',
							height: '600px',
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
};
