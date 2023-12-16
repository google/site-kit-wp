/**
 * UserRoleSelect Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import UserRoleSelect from './UserRoleSelect';

const dashboardSharingDataBaseVar = '_googlesitekitDashboardSharingData';
const sharingSettings = {
	'search-console': {
		sharedRoles: [ 'editor', 'administrator' ],
		management: 'all_admins',
	},
};
const shareableRoles = [
	{
		id: 'administrator',
		displayName: 'Administrator',
	},
	{
		id: 'editor',
		displayName: 'Editor',
	},
	{
		id: 'author',
		displayName: 'Author',
	},
	{
		id: 'contributor',
		displayName: 'Contributor',
	},
];
const dashboardSharingData = {
	settings: sharingSettings,
	roles: shareableRoles,
};

function Template( { setupRegistry = () => {}, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div style={ { padding: '40px 20px', backgroundColor: '#fff' } }>
				<UserRoleSelect { ...args } />
			</div>
		</WithRegistrySetup>
	);
}

export const DefaultUserRoleSelect = Template.bind( {} );
DefaultUserRoleSelect.storyName = 'Default';
DefaultUserRoleSelect.args = {
	moduleSlug: 'search-console',
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_MODULES )
			.receiveShareableRoles( shareableRoles );
		global[ dashboardSharingDataBaseVar ] = dashboardSharingData;
	},
};

export default {
	title: 'Components/UserRoleSelect',
	component: UserRoleSelect,
	parameters: { padding: 0 },
};
