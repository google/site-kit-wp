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
import classnames from 'classnames';
import { useMutationObserver } from 'react-use-observer';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Logo from './Logo';
import UserMenu from './UserMenu';
import ErrorNotifications from './notifications/ErrorNotifications';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../material-components';
import DashboardNavigation from './DashboardNavigation';
import EntityHeader from './EntityHeader';
import ViewOnlyMenu from './ViewOnlyMenu';
import SetupErrorNotification from './notifications/SetupErrorNotification';
import useViewOnly from '../hooks/useViewOnly';
import useDashboardType from '../hooks/useDashboardType';
import Link from './Link';
import SubtleNotifications from './notifications/SubtleNotifications';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';

const { useSelect } = Data;

function Header( { children, subHeader, showNavigation } ) {
	const isDashboard = !! useDashboardType();
	const isViewOnly = useViewOnly();

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);
	const [ subHeaderRef, subHeaderMutation ] = useMutationObserver( {
		childList: true,
	} );
	const hasSubheader = !! subHeaderMutation.target?.childElementCount;

	return (
		<Fragment>
			<header
				className={ classnames( 'googlesitekit-header', {
					'googlesitekit-header--has-subheader': hasSubheader,
					'googlesitekit-header--has-navigation': showNavigation,
				} ) }
			>
				<Grid>
					<Row>
						<Cell
							smSize={ 1 }
							mdSize={ 2 }
							lgSize={ 4 }
							className="googlesitekit-header__logo"
							alignMiddle
						>
							<Link
								aria-label={ __(
									'Go to dashboard',
									'google-site-kit'
								) }
								className="googlesitekit-header__logo-link"
								href={ dashboardURL }
							>
								<Logo />
							</Link>
						</Cell>
						<Cell
							smSize={ 3 }
							mdSize={ 6 }
							lgSize={ 8 }
							className="googlesitekit-header__children"
							alignMiddle
						>
							{ children }

							{ ! isAuthenticated &&
								isDashboard &&
								isViewOnly && <ViewOnlyMenu /> }
							{ isAuthenticated && ! isViewOnly && <UserMenu /> }
						</Cell>
					</Row>
				</Grid>
			</header>

			<div className="googlesitekit-subheader" ref={ subHeaderRef }>
				<ErrorNotifications />
				<SetupErrorNotification />
				{ subHeader }
			</div>

			{ showNavigation && <DashboardNavigation /> }

			{ isDashboard && <SubtleNotifications /> }

			<EntityHeader />
		</Fragment>
	);
}

Header.displayName = 'Header';

Header.propTypes = {
	children: PropTypes.node,
	subHeader: PropTypes.element,
	showNavigation: PropTypes.bool,
};

Header.defaultProps = {
	children: null,
	subHeader: null,
};

export default Header;
