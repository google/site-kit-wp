/**
 * Tag Manager Module Component Stories.
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
import { WithTestRegistry } from '../tests/js/utils';
import { MODULES_TAGMANAGER } from '../assets/js/modules/tagmanager/datastore/constants';
import {
	CORE_SITE,
	AMP_MODE_PRIMARY,
} from '../assets/js/googlesitekit/datastore/site/constants';
import * as fixtures from '../assets/js/modules/tagmanager/datastore/__fixtures__';
import AccountSelect from '../assets/js/modules/tagmanager/components/common/AccountSelect';
import WebContainerSelect from '../assets/js/modules/tagmanager/components/common/WebContainerSelect';
import AMPContainerSelect from '../assets/js/modules/tagmanager/components/common/AMPContainerSelect';
import UseSnippetSwitch from '../assets/js/modules/tagmanager/components/common/UseSnippetSwitch';

function SetupWrap( { children } ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">{ children }</div>
			</section>
		</div>
	);
}

storiesOf( 'Legacy/Tag Manager Module', module )
	.add( 'AccountSelect', () => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetAccounts( fixtures.accounts );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetExistingTag( null );
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'WebContainerSelect', () => {
		const setupRegistry = ( registry ) => {
			// eslint-disable-next-line sitekit/acronym-case
			const accountID = fixtures.getContainers.all[ 0 ].accountId;
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {
				accountID,
			} );
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					accountID,
				} );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetExistingTag( null );
			registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<WebContainerSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'AMPContainerSelect', () => {
		const setupRegistry = ( registry ) => {
			// eslint-disable-next-line sitekit/acronym-case
			const accountID = fixtures.getContainers.all[ 0 ].accountId;
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {
				accountID,
			} );
			registry.dispatch( MODULES_TAGMANAGER ).receiveGetAccounts( [] );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetContainers( fixtures.getContainers.all, {
					accountID,
				} );
			registry
				.dispatch( MODULES_TAGMANAGER )
				.receiveGetExistingTag( null );
			registry
				.dispatch( CORE_SITE )
				.receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AMPContainerSelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'UseSnippetSwitch', () => {
		const setupRegistry = ( registry ) => {
			registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
			registry.dispatch( MODULES_TAGMANAGER ).setUseSnippet( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<UseSnippetSwitch />
				</SetupWrap>
			</WithTestRegistry>
		);
	} );
