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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../header';
import PageHeader from '../page-header';
import Layout from '../layout/layout';
import HelpLink from '../help-link';
import SettingsAdmin from './settings-admin';
import SettingsModules from './settings-modules';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';

const { useSelect, useDispatch } = Data;

// tabID to tabIndex
const tabToIndex = {
	settings: 0,
	connect: 1,
	admin: 2,
};
const tabIDsByIndex = Object.keys( tabToIndex );

export default function SettingsApp() {
	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );
	const moduleSlug = useSelect( ( select ) => select( CORE_MODULES ).getCurrentSettingsViewModule() );
	const moduleState = useSelect( ( select ) => select( CORE_MODULES ).getSettingsViewModuleState( moduleSlug ) );
	const [ activeTabID, setActiveTabID ] = useState();

	const { setSettingsViewCurrentModule, setSettingsViewIsEditing } = useDispatch( CORE_MODULES );
	useEffect( () => {
		if ( modules === undefined ) {
			return;
		}
		// Route, e.g. #settings/analytics/(view|edit)
		const hashParts = global.location.hash.replace( '#', '' ).split( /\// );
		// eslint-disable-next-line prefer-const
		let [ tabID, slug, state ] = hashParts;
		slug = modules?.[ slug ] ? slug : '';

		setActiveTabID( tabID || 'settings' );
		setSettingsViewCurrentModule( slug );
		if ( slug && state === 'edit' ) {
			setSettingsViewIsEditing( true );
		}
	}, [ modules ] );

	useEffect( () => {
		const fragments = [ activeTabID ];

		if ( activeTabID === 'settings' ) {
			// eslint-disable-next-line no-unused-expressions
			moduleSlug && fragments.push( moduleSlug );
			// eslint-disable-next-line no-unused-expressions
			( moduleSlug && moduleState ) && fragments.push( moduleState );
		}

		global.location.hash = fragments.join( '/' );
	}, [ activeTabID, moduleSlug, moduleState ] );

	const handleTabUpdate = useCallback( ( index ) => setActiveTabID( tabIDsByIndex[ index ] ), [ tabIDsByIndex ] );
	const activeTabIndex = tabToIndex[ activeTabID ];

	let viewComponent;
	switch ( activeTabID ) {
		case 'settings':
		case 'connect':
			viewComponent = <SettingsModules activeTab={ activeTabIndex } />;
			break;
		case 'admin':
			viewComponent = <SettingsAdmin />;
			break;
	}

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
									activeIndex={ activeTabIndex }
									handleActiveIndexUpdate={ handleTabUpdate }
								>
									<Tab>
										<span className="mdc-tab__text-label">
											{ __( 'Connected Services', 'google-site-kit' ) }
										</span>
									</Tab>
									<Tab>
										<span className="mdc-tab__text-label">
											{ __( 'Connect More Services', 'google-site-kit' ) }
										</span>
									</Tab>
									<Tab>
										<span className="mdc-tab__text-label">
											{ __( 'Admin Settings', 'google-site-kit' ) }
										</span>
									</Tab>
								</TabBar>
							</Layout>
						</div>

						{ viewComponent }

						<div className={ classnames(
							'mdc-layout-grid__cell',
							'mdc-layout-grid__cell--span-12',
							'mdc-layout-grid__cell--align-right',
						) }>
							<HelpLink />
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
}
