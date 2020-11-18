/**
 * Header stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import Header from '../assets/js/components/Header';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'Global', module )
	.add( 'Plugin Header', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				proxySetupURL: 'https://sitekit.withgoogle.com/site-management/setup/',
				proxyPermissionsURL: 'https://sitekit.withgoogle.com/site-management/permissions/',
				referenceSiteURL: 'http://example.com',
				siteName: 'My Site Name',
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<Header />
			</WithTestRegistry>
		);
	}, {
		options: {
			delay: 3000, // Wait for image to load.
		},
	} );
