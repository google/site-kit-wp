/**
 * GoogleTagIDMismatchNotification Component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	WithTestRegistry,
	createTestRegistry,
	provideModules,
} from '../../../../tests/js/utils';
import GoogleTagIDMismatchNotification from './GoogleTagIDMismatchNotification';

function Template( { ...args } ) {
	return <GoogleTagIDMismatchNotification { ...args } />;
}

export const NoMismatchedTag = Template.bind( {} );
NoMismatchedTag.storyName = 'No Mismatched Tag';

export const MismatchedTag = Template.bind( {} );
MismatchedTag.storyName = 'Mismatched Tag';

export default {
	title: 'Components/GoogleTagIDMismatchNotification',
	component: GoogleTagIDMismatchNotification,
	decorators: [
		( Story, { parameters } ) => {
			const registry = createTestRegistry();

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			return (
				<WithTestRegistry
					registry={ registry }
					features={ parameters.features || [] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
