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

/**
 * External dependencies
 */
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import SettingsAdmin from './settings-admin';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../header';
import PageHeader from '../page-header';
import Layout from '../layout/layout';
import HelpLink from '../help-link';
import SettingsModules from './settings-modules';
import { getModulesData } from '../../util';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

const { withSelect, withDispatch } = Data;

// tabID to tabIndex
const tabToIndex = {
	settings: 0,
	connect: 1,
	admin: 2,
};
const tabIDsByIndex = Object.keys( tabToIndex );

class SettingsApp extends Component {
	constructor( props ) {
		super( props );
		// Route, e.g. #settings/analytics/(view|edit)
		const hashParts = global.location.hash.replace( '#', '' ).split( /\// );
		// eslint-disable-next-line prefer-const
		let [ activeTabID, moduleSlug, moduleState ] = hashParts;
		moduleSlug = getModulesData()[ moduleSlug ] ? moduleSlug : null;
		moduleState = [ 'view', 'edit' ].includes( moduleState ) ? moduleState : null;
		if ( moduleSlug && ! moduleState ) {
			moduleState = 'view';
		}

		this.state = {
			activeTabID: activeTabID || 'settings',
			moduleSlug,
			moduleState,
		};

		this.updateFragment = this.updateFragment.bind( this );
		this.handleTabUpdate = this.handleTabUpdate.bind( this );
	}

	componentDidMount() {
		const { moduleSlug, moduleState } = this.state;
		if ( moduleSlug && moduleState ) {
			this.props.setSettingsDisplayMode( moduleSlug, moduleState );
		}
	}

	componentDidUpdate() {
		this.updateFragment();
	}

	updateFragment() {
		const { activeTabID } = this.state;
		const fragments = [ activeTabID ];

		if ( activeTabID === 'settings' ) {
			const { moduleSlug, moduleState } = this.props;
			// eslint-disable-next-line no-unused-expressions
			moduleSlug && fragments.push( moduleSlug );
			// eslint-disable-next-line no-unused-expressions
			( moduleSlug && moduleState ) && fragments.push( moduleState );
		}

		global.location.hash = fragments.join( '/' );
	}

	handleTabUpdate( tabIndex ) {
		this.setState( { activeTabID: tabIDsByIndex[ tabIndex ] } );
	}

	render() {
		const { moduleSlug, moduleState } = this.props;
		const { activeTabID } = this.state;
		const activeTab = tabToIndex[ activeTabID ];

		return (
			<Fragment>
				<Header />
				<div className="googlesitekit-module-page">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<PageHeader title={ __( 'Settings', 'google-site-kit' ) } />
							</div>
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<Layout>
									<TabBar
										activeIndex={ activeTab }
										handleActiveIndexUpdate={ this.handleTabUpdate }
									>
										<Tab>
											<span className="mdc-tab__text-label">{ __( 'Connected Services', 'google-site-kit' ) }</span>
										</Tab>
										<Tab>
											<span className="mdc-tab__text-label">{ __( 'Connect More Services', 'google-site-kit' ) }</span>
										</Tab>
										<Tab>
											<span className="mdc-tab__text-label">{ __( 'Admin Settings', 'google-site-kit' ) }</span>
										</Tab>
									</TabBar>
								</Layout>
							</div>
							{ ( [ 'settings', 'connect' ].includes( activeTabID ) ) && // TODO Refactor SettingsModules into separate components.
								<SettingsModules
									activeTab={ activeTab }
									activeModule={ moduleSlug }
									moduleState={ moduleState }
									setActiveModule={ ( slug ) => this.props.setSettingsDisplayMode( slug || moduleSlug, slug ? ( moduleState || 'view' ) : 'closed' ) }
									setModuleState={ ( state ) => this.props.setSettingsDisplayMode( moduleSlug, state ) }
								/>
							}
							{ 'admin' === activeTabID && <SettingsAdmin /> }
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
								mdc-layout-grid__cell--align-right
							">
								<HelpLink />
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const store = select( CORE_MODULES );
		const moduleSlug = store.getModuleSlugWithActiveSettings();
		const moduleState = moduleSlug ? store.getSettingsDisplayMode( moduleSlug ) : '';

		return {
			moduleSlug,
			moduleState,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		setSettingsDisplayMode( moduleSlug, moduleState ) {
			dispatch( CORE_MODULES ).setSettingsDisplayMode( moduleSlug, moduleState );
		},
	} ) ),
)( SettingsApp );
