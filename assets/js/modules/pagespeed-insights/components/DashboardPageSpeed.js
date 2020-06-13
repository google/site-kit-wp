/**
 * Dashboard PageSpeed Widget component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

/**
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DeviceSizeTabBar from '../../../components/DeviceSizeTabBar';
import ProgressBar from '../../../components/progress-bar';
import Layout from '../../../components/layout/layout';
import LabReportMetrics from './LabReportMetrics';
import FieldReportMetrics from './FieldReportMetrics';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	STORE_NAME,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	FORM_DASH_WIDGET,
} from '../datastore/constants';

const { useSelect, useDispatch } = Data;

export default function DashboardPageSpeed() {
	// TODO: replace global with selector.
	const permalink = global._googlesitekitLegacyData.permaLink;
	const referenceURL = useSelect( ( select ) => select( CORE_SITE ).getReferenceSiteURL() );
	const url = permalink || referenceURL;
	const reportMobile = useSelect( ( select ) => select( STORE_NAME ).getReport( url, STRATEGY_MOBILE ) );
	const reportDesktop = useSelect( ( select ) => select( STORE_NAME ).getReport( url, STRATEGY_DESKTOP ) );
	const strategy = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_DASH_WIDGET, 'strategy' ) ) || STRATEGY_MOBILE;
	const dataSrc = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_DASH_WIDGET, 'dataSrc' ) );

	const { setValues } = useDispatch( CORE_FORMS );
	const setStrategyMobile = useCallback( () => setValues( FORM_DASH_WIDGET, { strategy: STRATEGY_MOBILE } ), [] );
	const setStrategyDesktop = useCallback( () => setValues( FORM_DASH_WIDGET, { strategy: STRATEGY_DESKTOP } ), [] );
	const setDataSrcField = useCallback( () => setValues( FORM_DASH_WIDGET, { dataSrc: DATA_SRC_FIELD } ), [] );
	const setDataSrcLab = useCallback( () => setValues( FORM_DASH_WIDGET, { dataSrc: DATA_SRC_LAB } ), [] );

	const [ activeTab, setActiveTab ] = useState( 'in_the_lab' ); //eslint-disable-line

	const [ activeDeviceSize, setActiveDeviceSize ] = useState( 'mobile' ); //eslint-disable-line

	// Set the default data source based on report data.
	useEffect( () => {
		if ( ! reportMobile || ! reportDesktop ) {
			return;
		}
		if ( reportMobile?.loadingExperience?.metrics && reportDesktop?.loadingExperience?.metrics ) {
			setDataSrcField();
		} else {
			setDataSrcLab();
		}
	}, [ reportMobile, reportDesktop ] );

	if ( ! reportMobile || ! reportDesktop || ! dataSrc ) {
		return <ProgressBar />;
	}

	const reportData = strategy === STRATEGY_MOBILE ? reportMobile : reportDesktop;

	const updateActiveDeviceSize = ( deviceIndex ) => {
		console.log( 'updateActiveDevice', deviceIndex ); //eslint-disable-line
		setActiveDeviceSize( deviceIndex === 1 ? 'desktop' : 'mobile' );
		if ( deviceIndex === 1 ) {
			setStrategyDesktop();
		} else {
			setStrategyMobile();
		}
	};

	const updateActiveTab = ( tabIndex ) => {
		console.log( 'tabIndex', tabIndex ); //eslint-disable-line
		setActiveTab( tabIndex === 1 ? 'in_the_field' : 'in_the_lab' );
	};

	console.log( reportMobile ); //eslint-disable-line

	return (
		<Fragment>
			<Layout
				className="googlesitekit-pagespeed-widget"
			>
				<header>
					<div className="googlesitekit-pagespeed-data-src-tabs">
						{ /* Temporarily use danger as an "active" state */ }
						<TabBar
							activeIndex={ activeTab === 'in_the_field' ? 1 : 0 }
							handleActiveIndexUpdate={ updateActiveTab }
						>
							<Tab>
								<span className="mdc-tab__text-label">{ __( 'In the Lab', 'google-site-kit' ) }</span>
							</Tab>
							<Tab>
								<span className="mdc-tab__text-label">{ __( 'In the Field', 'google-site-kit' ) }</span>
							</Tab>
						</TabBar>
						{ /* <Link
							danger={ dataSrc === DATA_SRC_FIELD }
							onClick={ setDataSrcField }
						>
							{ __( 'In the Field', 'google-site-kit' ) }
						</Link>
						<Link
							danger={ dataSrc === DATA_SRC_LAB }
							onClick={ setDataSrcLab }
						>
							{ __( 'In the Lab', 'google-site-kit' ) }
						</Link> */ }
					</div>
					<DeviceSizeTabBar
						activeIndex={ activeDeviceSize === 'desktop' ? 1 : 0 }
						handleDeviceSizeUpdate={ updateActiveDeviceSize }
					/>
					{ /* <div className="googlesitekit-pagespeed-strategy-button-group">
						<Link
							danger={ strategy === STRATEGY_MOBILE }
							onClick={ setStrategyMobile }
						>
							mobile
						</Link>
						<Link
							danger={ strategy === STRATEGY_DESKTOP }
							onClick={ setStrategyDesktop }
						>
							desktop
						</Link>
					</div> */ }
				</header>
				<main>
					{ activeTab === 'in_the_lab' && <LabReportMetrics data={ reportData } /> }
					{ activeTab === 'in_the_field' && <FieldReportMetrics data={ reportData } /> }
				</main>
			</Layout>
		</Fragment>
	);
}
