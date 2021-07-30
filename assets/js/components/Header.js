/**
 * Header component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Logo from './Logo';
import UserMenu from './UserMenu';
import ErrorNotifications from './notifications/ErrorNotifications';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

const Header = ( { children } ) => {
	const isAuthenticated = useSelect( ( select ) => select( CORE_USER ).isAuthenticated() );

	return (
		<Fragment>
			<header className="googlesitekit-header">
				<section className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							googlesitekit-header__logo
							mdc-layout-grid__cell
							mdc-layout-grid__cell--align-middle
							mdc-layout-grid__cell--span-1-phone
							mdc-layout-grid__cell--span-2-tablet
							mdc-layout-grid__cell--span-4-desktop
						">
							<Logo />
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--align-middle
							mdc-layout-grid__cell--align-right-phone
							mdc-layout-grid__cell--span-3-phone
							mdc-layout-grid__cell--span-6-tablet
							mdc-layout-grid__cell--span-8-desktop
						">
							{ children }
							{ isAuthenticated && <UserMenu /> }
						</div>
					</div>
				</section>
			</header>

			<ErrorNotifications />
		</Fragment>
	);
};

export default Header;
