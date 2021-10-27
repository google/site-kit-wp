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
 * External dependencies
 */
import PropTypes from 'prop-types';

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
import SubHeader from './SubHeader';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../material-components';
const { useSelect } = Data;

const Header = ( { children, subHeader } ) => {
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	return (
		<Fragment>
			<header className="googlesitekit-header">
				<Grid>
					<Row>
						<Cell
							smSize={ 1 }
							mdSize={ 2 }
							lgSize={ 4 }
							className="googlesitekit-header__logo"
							alignMiddle
						>
							<Logo />
						</Cell>
						<Cell
							smSize={ 3 }
							mdSize={ 6 }
							lgSize={ 8 }
							className="mdc-layout-grid__cell--align-right-phone"
							alignMiddle
						>
							{ children }
							{ isAuthenticated && <UserMenu /> }
						</Cell>
					</Row>
				</Grid>
			</header>

			{ subHeader && <SubHeader>{ subHeader }</SubHeader> }

			<ErrorNotifications />
		</Fragment>
	);
};

Header.displayName = 'Header';

Header.propTypes = {
	children: PropTypes.node,
	subHeader: PropTypes.element,
};

Header.defaultProps = {
	children: null,
	subHeader: null,
};

export default Header;
