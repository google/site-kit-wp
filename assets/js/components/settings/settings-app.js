/**
 * SettingsApp component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import SettingsModules from './settings-modules';
import Header from 'GoogleComponents/header';
import PageHeader from 'GoogleComponents/page-header';
import Layout from 'GoogleComponents/layout/layout';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import SettingsAdmin from './settings-admin';
import HelpLink from 'GoogleComponents/help-link';

const { Component, Fragment } = wp.element;
const { __ } = wp.i18n;

class SettingsApp extends Component {

	constructor( props ) {
		super( props );
		const hashedTab = window.location.hash.replace( '#', '' );

		this.state = {
			activeTab: hashedTab ? Number( hashedTab ) : 0
		};

		this.handleTabUpdate = this.handleTabUpdate.bind( this );
	}

	handleTabUpdate( tabIndex ) {
		const activeTab = -1 === tabIndex ? 0 : tabIndex; // Check for invalid index.
		window.location.hash = activeTab;
		this.setState( {
			activeTab: activeTab
		} );
	}

	render() {
		const { activeTab } = this.state;
		return (
			<Fragment>
				<Header/>
				<div className="googlesitekit-module-page">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<PageHeader title={ __( 'Settings', 'google-site-kit' ) }/>
							</div>
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<Layout>
									<TabBar
										activeIndex={ activeTab }
										handleActiveIndexUpdate={ this.handleTabUpdate }
									>
										<Tab>
											<span className='mdc-tab__text-label'>{ __( 'Connected Services', 'google-site-kit' ) }</span>
										</Tab>
										<Tab>
											<span className='mdc-tab__text-label'>{ __( 'Connect More Services', 'google-site-kit' ) }</span>
										</Tab>
										<Tab>
											<span className='mdc-tab__text-label'>{ __( 'Admin Settings', 'google-site-kit' ) }</span>
										</Tab>
									</TabBar>
								</Layout>
							</div>
							{ ( 0 === activeTab || 1 === activeTab ) && // If we're on Connected or Add tabs. TODO Refactor SettingsModules into separate components.
								<SettingsModules activeTab={ activeTab } />
							}
							{ 2 === activeTab && // If we're on Settings tab.
								<Fragment>
									<SettingsAdmin/>
								</Fragment>
							}
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								mdc-layout-grid__cell--align-right
							">
								<HelpLink/>
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default SettingsApp;
