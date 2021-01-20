/**
 * Admin Bar Component Stories.
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
 * Internal dependencies
 */
import { GoogleSitekitAdminbar } from '../assets/js/googlesitekit-adminbar';
import { googlesitekit as wpAdminBarData } from '../.storybook/data/blog---googlesitekit';
import { STORE_NAME as CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';
import CollectModuleData from '../assets/js/components/data/collect-module-data';

storiesOf( 'Global', module )
	.add( 'Admin Bar', () => {
		global._googlesitekitLegacyData = wpAdminBarData;

		const setupRegistry = ( { dispatch } ) => {
			dispatch( CORE_SITE ).receiveSiteInfo( {
				usingProxy: true,
				referenceSiteURL: 'https://example.com',
				adminURL: 'https://example.com/wp-admin/',
				siteName: 'My Site Name',
				currentEntityURL: 'https://www.sitekitbygoogle.com/blog/',
				currentEntityTitle: 'Blog test post for Google Site Kit',
				currentEntityType: 'blog',
				currentEntityID: 2,
			} );
			dispatch( CORE_USER ).receiveGetAuthentication( {
				authenticated: true,
				requiredScopes: [],
				grantedScopes: [],
			} );
		};

		return (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div id="js-googlesitekit-adminbar" className="ab-sub-wrapper googlesitekit-adminbar" style={ { display: 'block' } }>
						<section id="js-googlesitekit-adminbar-modules" className="googlesitekit-adminbar-modules">
							<WithTestRegistry callback={ setupRegistry }>
								<GoogleSitekitAdminbar />
								<CollectModuleData context="Adminbar" />
							</WithTestRegistry>
						</section>
					</div>
				</div>
			</div>
		);
	} );
