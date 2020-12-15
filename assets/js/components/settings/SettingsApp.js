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
import { useHash } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import SettingsAdmin from './settings-admin';
import Header from '../Header';
import PageHeader from '../PageHeader';
import Layout from '../layout/layout';
import HelpLink from '../HelpLink';
import SettingsModules from './settings-modules';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '../../material-components';

const { useSelect, useDispatch } = Data;

export default function SettingsApp() {
	const [ hash, setHash ] = useHash();

	const parseHash = ( hashToParse ) => hashToParse.replace( '#', '' ).split( /\// );

	useEffect( () => {
		if ( hash ) {
			const [ , moduleSlug, moduleState ] = parseHash( hash );
			if ( moduleSlug && moduleState ) {
				setModuleSettingsPanelState( moduleSlug, moduleState );
			}
		} else {
			setHash( hashFrom( activeTabID ) );
		}
	}, [] );

	let [ activeTabID, moduleSlug, moduleState ] = parseHash( hash );
	if ( ! activeTabID ) {
		activeTabID = 'settings';
	}

	moduleSlug = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( moduleSlug ) ) && moduleSlug;
	moduleState = useSelect( ( select ) => moduleSlug ? select( CORE_MODULES ).getModuleSettingsPanelState( moduleSlug ) : null );

	const { setModuleSettingsPanelState } = useDispatch( CORE_MODULES );

	if ( moduleSlug && ! moduleState ) {
		moduleState = 'view';
	}

	const activeTab = SettingsApp.tabToIndex[ activeTabID ];

	const hashFrom = ( tabID, slug = moduleSlug, state = moduleState ) => {
		const fragments = [ tabID ];

		if ( tabID === 'settings' && slug ) {
			fragments.push( slug );
			if ( state ) {
				fragments.push( state );
			}
		}

		return fragments.join( '/' );
	};

	const setModuleState = ( slug, state ) => {
		setModuleSettingsPanelState( slug, state );
		setHash( hashFrom( activeTabID, slug, state ) );
	};

	const handleTabUpdate = ( tabIndex ) => {
		const newActiveTabID = SettingsApp.tabIDsByIndex[ tabIndex ];
		setHash( hashFrom( newActiveTabID ) );
	};

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
								<TabBar
									activeIndex={ activeTab }
									handleActiveIndexUpdate={ handleTabUpdate }
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
						</Cell>
						{ [ 'settings', 'connect' ].includes( activeTabID ) && ( // TODO Refactor SettingsModules into separate components.
							<SettingsModules
								activeTab={ activeTab }
								activeModule={ moduleSlug }
								moduleState={ moduleState }
								setModuleState={ setModuleState }
							/>
						) }
						{ 'admin' === activeTabID && (
							<SettingsAdmin />
						) }
						<Cell size={ 12 } alignRight>
							<HelpLink />
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}

// tabID to tabIndex
SettingsApp.tabToIndex = {
	settings: 0,
	connect: 1,
	admin: 2,
};
SettingsApp.tabIDsByIndex = Object.keys( SettingsApp.tabToIndex );
