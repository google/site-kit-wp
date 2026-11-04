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
 * External dependencies
 */
import { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { Story } from '@/js/types/Story';
import { provideUserCapabilities, provideUserInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import { SubscribedUser } from './SubscribedUserRow';
import SubscribedUsers from '.';

interface SubscribedUsersStoryProps {
	setupRegistry?: ( registry: WPDataRegistry ) => void;
	// VRT scenarios pause CSS animations, but the "Loading" state's skeleton
	// shimmer is only paused by this class, not the shared VRT stylesheet.
	pauseAnimation?: boolean;
}

const mockSubscribedUsers: SubscribedUser[] = [
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

const manyUsers: SubscribedUser[] = [
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

function Template() {
	return <SubscribedUsers />;
}

const defaultQueryArgs = { search: '' };

function createSubscribedUsersResponse( users: SubscribedUser[] ) {
	return {
		users,
		total: users.length,
		totalPages: 1,
	};
}

export const Default = Template.bind(
	{}
) as Story< SubscribedUsersStoryProps >;
Default.storyName = 'Default (3 users, no search)';
Default.scenario = {};
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

export const WithSearch = Template.bind(
	{}
) as Story< SubscribedUsersStoryProps >;
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

export const Empty = Template.bind( {} ) as Story< SubscribedUsersStoryProps >;
Empty.storyName = 'Empty State (no subscribed users)';
Empty.scenario = {};
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

export const Loading = Template.bind(
	{}
) as Story< SubscribedUsersStoryProps >;
Loading.storyName = 'Loading State';
Loading.scenario = {};
Loading.args = {
	pauseAnimation: true,
	setupRegistry: ( registry ) => {
		// Start resolution but never finish it so the component stays in loading state.
		registry
			.dispatch( CORE_SITE )
			.startResolution( 'getSubscribedUsers', [ defaultQueryArgs ] );
	},
};

export default {
	title: 'Components/EmailReporting/SubscribedUsers',
	component: SubscribedUsers,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: SubscribedUsersStoryProps }
		) => {
			function setupRegistry( registry: WPDataRegistry ) {
				provideUserCapabilities( registry );
				provideUserInfo( registry, { id: 1 } );
				registry
					.dispatch( CORE_UI )
					.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			const content = (
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
					<StoryComponent />
				</div>
			);

			return (
				<WithRegistrySetup func={ setupRegistry }>
					{ args?.pauseAnimation ? (
						<div className="googlesitekit-vrt-animation-paused">
							{ content }
						</div>
					) : (
						content
					) }
				</WithRegistrySetup>
			);
		},
	],
};
