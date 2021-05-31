/**
 * Dashboard Page Stories.
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
import DashboardModuleHeader from '../assets/js/components/dashboard/DashboardModuleHeader';
import PostSearcher from '../assets/js/components/PostSearcher';
import URLSearchWidget from '../assets/js/googlesitekit/widgets/components/URLSearchWidget';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { provideSiteInfo, WithTestRegistry } from '../tests/js/utils';
import { getWidgetComponentProps } from '../assets/js/googlesitekit/widgets/util';

storiesOf( 'Dashboard', module )
	.add( 'Module Header', () => (
		<DashboardModuleHeader
			title={ __( 'Module Header', 'google-site-kit' ) }
			description={ __( 'Description of Module', 'google-site-kit' ) }
		/>
	) )
	.add( 'Post Searcher', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'http://example.com',
				adminURL: 'http://example.com/wp-admin',
				timezone: 'America/Detroit',
				siteName: 'My Site Name',
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<PostSearcher />
			</WithTestRegistry>
		);
	} )
	.add( 'URL Search Widget', () => {
		const setupRegistry = ( registry ) => provideSiteInfo( registry );
		const widgetComponentProps = getWidgetComponentProps( 'urlSearch' );

		return (
			<WithTestRegistry callback={ setupRegistry } >
				<URLSearchWidget { ...widgetComponentProps } />
			</WithTestRegistry>
		);
	} );
