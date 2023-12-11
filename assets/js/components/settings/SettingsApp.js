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
import { withRouter, Link, useLocation } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import Header from '../Header';
import PageHeader from '../PageHeader';
import Layout from '../layout/Layout';
import SettingsModules from './SettingsModules';
import { Cell, Grid, Row } from '../../material-components';
import HelpMenu from '../help/HelpMenu';
import { trackEvent } from '../../util/tracking';
import useViewContext from '../../hooks/useViewContext';

function SettingsApp() {
	const location = useLocation();
	// Prevent pushing to hash history if it would send you to the same URL.
	// (Without this React Router will trigger a warning.)
	const shouldReplaceHistory = ( path ) => false && basePath === path;
	const [ , basePath ] = location.pathname.split( '/' );
	const activeTab = SettingsApp.basePathToTabIndex[ basePath ];

	const viewContext = useViewContext();

	const handleTabChange = useCallback( () => {
		trackEvent( viewContext, 'tab_select', basePath );
	}, [ basePath, viewContext ] );

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>

			<div className="googlesitekit-module-page">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<PageHeader
								title={ __( 'Settings', 'google-site-kit' ) }
							/>
						</Cell>
						<Cell size={ 12 }>
							<Layout transparent rounded>
								<TabBar
									activeIndex={ activeTab }
									className="googlesitekit-tab-bar__settings"
									handleActiveIndexUpdate={ handleTabChange }
								>
									<Tab
										tag={ Link }
										to="/connected-services"
										replace={ shouldReplaceHistory(
											'connected-services'
										) }
									>
										<span className="mdc-tab__text-label">
											{ __(
												'Connected Services',
												'google-site-kit'
											) }
										</span>
									</Tab>
									<Tab
										tag={ Link }
										to="/connect-more-services"
										replace={ shouldReplaceHistory(
											'connect-more-services'
										) }
									>
										<span className="mdc-tab__text-label">
											{ __(
												'Connect More Services',
												'google-site-kit'
											) }
										</span>
									</Tab>
									<Tab
										tag={ Link }
										to="/admin-settings"
										replace={ shouldReplaceHistory(
											'admin-settings'
										) }
									>
										<span className="mdc-tab__text-label">
											{ __(
												'Admin Settings',
												'google-site-kit'
											) }
										</span>
									</Tab>
								</TabBar>
							</Layout>
						</Cell>
						<Cell size={ 12 }>
							<SettingsModules />
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}

SettingsApp.propTypes = {};

// Necessary to set `TabBar.activeIndex`
SettingsApp.basePathToTabIndex = {
	'connected-services': 0,
	'connect-more-services': 1,
	'admin-settings': 2,
};

export default withRouter( SettingsApp );
