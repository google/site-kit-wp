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
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DeviceSizeTabBar from '../../../../components/DeviceSizeTabBar';
import ProgressBar from '../../../../components/progress-bar';
import Layout from '../../../../components/layout/layout';
import LabReportMetrics from '../common/LabReportMetrics';
import FieldReportMetrics from '../common/FieldReportMetrics';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	STORE_NAME,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
	DATA_SRC_FIELD,
	DATA_SRC_LAB,
	FORM_DASH_WIDGET,
} from '../../datastore/constants';

const { useSelect, useDispatch } = Data;

export default function DashboardPageSpeed() {
	const referenceURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentReferenceURL() );
	const reportMobile = useSelect( ( select ) => select( STORE_NAME ).getReport( referenceURL, STRATEGY_MOBILE ) );
	const reportDesktop = useSelect( ( select ) => select( STORE_NAME ).getReport( referenceURL, STRATEGY_DESKTOP ) );
	const strategy = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_DASH_WIDGET, 'strategy' ) ) || STRATEGY_MOBILE;
	const dataSrc = useSelect( ( select ) => select( CORE_FORMS ).getValue( FORM_DASH_WIDGET, 'dataSrc' ) ) || DATA_SRC_LAB;

	const { setValues } = useDispatch( CORE_FORMS );
	const setStrategyMobile = useCallback( () => setValues( FORM_DASH_WIDGET, { strategy: STRATEGY_MOBILE } ), [] );
	const setStrategyDesktop = useCallback( () => setValues( FORM_DASH_WIDGET, { strategy: STRATEGY_DESKTOP } ), [] );
	const setDataSrcField = useCallback( () => setValues( FORM_DASH_WIDGET, { dataSrc: DATA_SRC_FIELD } ), [] );
	const setDataSrcLab = useCallback( () => setValues( FORM_DASH_WIDGET, { dataSrc: DATA_SRC_LAB } ), [] );

	// Update the active tab for "In the Lab" or "In The Field".
	const updateActiveTab = useCallback( ( dataSrcIndex ) => {
		if ( dataSrcIndex === 0 ) {
			setDataSrcLab();
		} else {
			setDataSrcField();
		}
	}, [] );
	// Update the active tab for "mobile" or "desktop".
	const updateActiveDeviceSize = useCallback( ( { slug } ) => {
		if ( slug === STRATEGY_DESKTOP ) {
			setStrategyDesktop();
		} else {
			setStrategyMobile();
		}
	}, [] );

	// Set the default data source based on report data.
	useEffect( () => {
		if ( reportMobile?.loadingExperience?.metrics && reportDesktop?.loadingExperience?.metrics ) {
			setDataSrcField();
		}
	}, [ reportMobile, reportDesktop ] );

	if ( ! referenceURL || ! reportMobile || ! reportDesktop || ! dataSrc ) {
		return (
			<Layout className="googlesitekit-pagespeed-widget">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className=" mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
							<ProgressBar />
							<p className="googlesitekit-text-align-center">
								{ __( 'PageSpeed Insights is preparing data…', 'google-site-kit' ) }
							</p>
						</div>
					</div>
				</div>
			</Layout>
		);
	}

	const reportData = strategy === STRATEGY_MOBILE ? reportMobile : reportDesktop;

	return (
		<Layout className="googlesitekit-pagespeed-widget">
			<header className="googlesitekit-pagespeed-widget__header">
				<div className="googlesitekit-pagespeed-widget__data-src-tabs">
					<TabBar
						activeIndex={ [ DATA_SRC_LAB, DATA_SRC_FIELD ].indexOf( dataSrc ) }
						handleActiveIndexUpdate={ updateActiveTab }
					>
						<Tab
							focusOnActivate={ false }
							aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_LAB }` }
						>
							<span
								id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_LAB }` }
								className="mdc-tab__text-label"
							>
								{ __( 'In the Lab', 'google-site-kit' ) }
							</span>
						</Tab>
						<Tab
							focusOnActivate={ false }
							aria-labelledby={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_FIELD }` }
						>
							<span
								id={ `googlesitekit-pagespeed-widget__data-src-tab-${ DATA_SRC_FIELD }` }
								className="mdc-tab__text-label"
							>
								{ __( 'In the Field', 'google-site-kit' ) }
							</span>
						</Tab>
					</TabBar>
				</div>
				<div className="googlesitekit-pagespeed-widget__device-size-tab-bar-wrapper">
					<DeviceSizeTabBar
						activeTab={ strategy }
						handleDeviceSizeUpdate={ updateActiveDeviceSize }
					/>
				</div>
			</header>
			<section>
				{ dataSrc === DATA_SRC_LAB && <LabReportMetrics data={ reportData } /> }
				{ dataSrc === DATA_SRC_FIELD && <FieldReportMetrics data={ reportData } /> }
			</section>
		</Layout>
	);
}
