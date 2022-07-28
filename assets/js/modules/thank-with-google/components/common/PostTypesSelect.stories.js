/**
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
import PostTypesSelect from './PostTypesSelect';
import { MODULES_THANK_WITH_GOOGLE } from '../../datastore/constants';
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

const Template = ( args ) => <PostTypesSelect { ...args } />;

export const DefaultPostTypesSelect = Template.bind( {} );
DefaultPostTypesSelect.storyName = 'PostTypesSelect';
DefaultPostTypesSelect.args = {};

export default {
	title: 'Modules/Thank with Google/Common',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry );
				provideModules( registry, [
					{
						slug: 'thank-with-google',
						active: true,
						connected: true,
					},
				] );

				registry
					.dispatch( MODULES_THANK_WITH_GOOGLE )
					.receiveGetSettings( {
						ctaPostTypes: [ 'post' ],
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
