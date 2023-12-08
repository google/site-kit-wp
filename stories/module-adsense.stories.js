/**
 * AdSense Stories.
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
import {
	AccountSelect,
	UseSnippetSwitch,
	AdBlockerWarning,
	UserProfile,
} from '../assets/js/modules/adsense/components/common';
import { WithTestRegistry } from '../tests/js/utils';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';
import { MODULES_ADSENSE } from '../assets/js/modules/adsense/datastore/constants';

function SetupWrap( { children } ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">{ children }</div>
			</section>
		</div>
	);
}

storiesOf( 'AdSense Module', module )
	.add( 'Account Select, none selected', () => {
		const accounts = fixtures.accountsMultiple;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ADSENSE ).receiveGetAccounts( accounts );
			dispatch( MODULES_ADSENSE ).receiveGetSettings( {} );
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
	.add( 'Account Select, selected', () => {
		const accounts = fixtures.accountsMultiple;
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ADSENSE ).receiveGetAccounts( accounts );
			dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				accountID: accounts[ 0 ]._id,
			} );
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
	.add( 'Use Snippet Switch, toggled on (default)', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ADSENSE ).setUseSnippet( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<UseSnippetSwitch />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'Use Snippet Switch, toggled off', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ADSENSE ).setUseSnippet( false );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<UseSnippetSwitch />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'AdBlocker Warning', () => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ADSENSE ).receiveIsAdBlockerActive( true );
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AdBlockerWarning />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} )
	.add( 'User Profile', () => {
		const setupRegistry = () => {};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<UserProfile />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	} );
