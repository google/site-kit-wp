/**
 * UserMenu stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import {
	provideSiteInfo,
	provideUserInfo,
	WithTestRegistry,
} from '../../../../tests/js/utils';
import UserMenu from '.';

function Template( args ) {
	return <UserMenu { ...args } />;
}

export const DefaultUserMenu = Template.bind( {} );

export default {
	title: 'Components/UserMenu',
	component: UserMenu,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideUserInfo( registry );
			};

			return (
				<WithTestRegistry callback={ setupRegistry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
