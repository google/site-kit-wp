/**
 * SettingsApp component.
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
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import { withRouter, Link as NavLink } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Header from '../Header';
import PageHeader from '../PageHeader';
import Layout from '../layout/Layout';
import HelpLink from '../HelpLink';
import SettingsModules from './SettingsModules';
import { Cell, Grid, Row } from '../../material-components';

function SettingsApp( { location: { pathname } } ) {
	// Don't pass NavLink component if it would send you to same URL, prevents a warning.
	const getTag = ( path ) => basePath === path ? 'button' : NavLink;
	const [ , basePath ] = pathname.split( '/' );
	const activeTab = SettingsApp.basePathToTabIndex[ basePath ];

	return (
		<Fragment>
			<Header />
			<div className="googlesitekit-module-page">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<PageHeader title={ __( 'Settings', 'google-site-kit' ) } />
						</Cell>
						<Cell size={ 12 }>
							<Layout>
								<TabBar activeIndex={ activeTab }>
									<Tab tag={ getTag( 'connected-services' ) } to="/connected-services">
										<span className="mdc-tab__text-label">{ __( 'Connected Services', 'google-site-kit' ) }</span>
									</Tab>
									<Tab tag={ getTag( 'connect-more-services' ) } to="/connect-more-services">
										<span className="mdc-tab__text-label">{ __( 'Connect More Services', 'google-site-kit' ) }</span>
									</Tab>
									<Tab tag={ getTag( 'admin-settings' ) } to="/admin-settings">
										<span className="mdc-tab__text-label">{ __( 'Admin Settings', 'google-site-kit' ) }</span>
									</Tab>
								</TabBar>
							</Layout>
						</Cell>
						<SettingsModules />
						<Cell size={ 12 } alignRight>
							<HelpLink />
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}

SettingsApp.propTypes = {
	location: PropTypes.shape( {
		pathname: PropTypes.string.isRequired,
	} ).isRequired,
};

// Necessary to set `TabBar.activeIndex`
SettingsApp.basePathToTabIndex = {
	'connected-services': 0,
	'connect-more-services': 1,
	'admin-settings': 2,
};

export default withRouter( SettingsApp );
