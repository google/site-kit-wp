/**
 * Header stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../assets/js/components/Header';
import DateRangeSelector from '../assets/js/components/DateRangeSelector';
import HelpMenu from '../assets/js/components/help/HelpMenu';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserAuthentication,
	WithTestRegistry,
} from '../tests/js/utils';
import HelpMenuLink from '../assets/js/components/help/HelpMenuLink';
import { Provider as ViewContextProvider } from '../assets/js/components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../assets/js/googlesitekit/constants';

const withRegistry = ( Story ) => {
	const registry = createTestRegistry();
	provideUserAuthentication( registry );
	provideSiteInfo( registry );

	return (
		<WithTestRegistry registry={ registry }>
			<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
				<Story registry={ registry } />
			</ViewContextProvider>
		</WithTestRegistry>
	);
};

storiesOf( 'Global', module )
	.add(
		'Plugin Header',
		() => {
			return <Header />;
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Plugin Header with Date Selector',
		() => {
			return (
				<Header>
					<DateRangeSelector />
				</Header>
			);
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Plugin Header with Help Menu',
		() => {
			return (
				<Header>
					<HelpMenu />
				</Header>
			);
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Plugin Header with Help Menu and Date Range Selector',
		() => {
			return (
				<Header>
					<HelpMenu />
					<DateRangeSelector />
				</Header>
			);
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	)
	.add(
		'Plugin Header with custom Help Menu links',
		() => {
			return (
				<Header>
					<HelpMenu>
						<HelpMenuLink href="#">
							{ __( 'Get help with AdSense', 'google-site-kit' ) }
						</HelpMenuLink>
					</HelpMenu>
				</Header>
			);
		},
		{
			decorators: [ withRegistry ],
			padding: 0,
		}
	);
