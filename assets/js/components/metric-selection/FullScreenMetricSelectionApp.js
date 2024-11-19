/**
 * Full Screen Metric Selection App.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * WordPress dependencies
 */
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useInViewSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { isFeatureEnabled } from '../../features';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Cell, Grid, Row } from '../../material-components';
import Header from '../Header';
import HelpMenu from '../help/HelpMenu';
import Layout from '../layout/Layout';
import PageHeader from '../PageHeader';
import PanelContent from '../KeyMetrics/MetricsSelectionPanel/PanelContent';
import {
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
} from '../KeyMetrics/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';

export default function FullScreenMetricSelectionApp() {
	const conversionReportingEnabled = isFeatureEnabled(
		'conversionReporting'
	);

	const [ canRender, setCanRender ] = useState( true );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setValues } = useDispatch( CORE_FORMS );

	const mainDashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const hasFinishedGettingInputSettings = useSelect( ( select ) => {
		select( CORE_USER ).getUserInputSettings();

		return select( CORE_USER ).hasFinishedResolution(
			'getUserInputSettings'
		);
	} );

	const closePanel = useCallback( () => {
		navigateTo( mainDashboardURL );
	}, [ navigateTo, mainDashboardURL ] );

	const savedViewableMetrics = useInViewSelect( ( select ) => {
		const metrics = select( CORE_USER ).getKeyMetrics();

		if ( ! Array.isArray( metrics ) ) {
			return [];
		}

		const { isKeyMetricAvailable } = select( CORE_USER );

		return metrics.filter( isKeyMetricAvailable );
	} );

	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	useEffect( () => {
		if (
			( ! conversionReportingEnabled || isKeyMetricsSetupCompleted ) &&
			mainDashboardURL
		) {
			navigateTo( mainDashboardURL );
			setCanRender( false );
		}
	}, [
		conversionReportingEnabled,
		mainDashboardURL,
		navigateTo,
		isKeyMetricsSetupCompleted,
		setCanRender,
	] );

	useEffect( () => {
		setValues( KEY_METRICS_SELECTION_FORM, {
			[ KEY_METRICS_SELECTED ]: savedViewableMetrics,
		} );
	}, [ savedViewableMetrics, setValues ] );

	return (
		undefined !== isKeyMetricsSetupCompleted &&
		canRender && (
			<Fragment>
				<Header>
					<HelpMenu />
				</Header>
				<div className="googlesitekit-user-input">
					<div className="googlesitekit-module-page">
						{ ! hasFinishedGettingInputSettings && (
							<Grid>
								<Row>
									<Cell
										lgSize={ 12 }
										mdSize={ 8 }
										smSize={ 4 }
									>
										<ProgressBar />
									</Cell>
								</Row>
							</Grid>
						) }
						{ hasFinishedGettingInputSettings && (
							<Grid>
								<Layout rounded>
									<Grid className="googlesitekit-user-input__header">
										<Row>
											<Cell
												lgSize={ 12 }
												mdSize={ 12 }
												smSize={ 12 }
											>
												<PageHeader
													className="googlesitekit-heading-3 googlesitekit-user-input__heading"
													title={ __(
														'Select up to 8 metrics that are most important for your business goals',
														'google-site-kit'
													) }
													fullWidth
												/>
											</Cell>
											<Cell
												lgSize={ 12 }
												mdSize={ 12 }
												smSize={ 12 }
											>
												<span className="googlesitekit-user-input__subtitle">
													{ __(
														"Site Kit will start collecting data and add them on your dashboard. You can change your selection later on from Site Kit's main dashboard.",
														'google-site-kit'
													) }
												</span>
											</Cell>
										</Row>
									</Grid>

									<Grid className="googlesitekit-user-input__content">
										<Row>
											<Cell
												lgSize={ 12 }
												mdSize={ 12 }
												smSize={ 12 }
											>
												<PanelContent
													closePanel={ closePanel }
													savedViewableMetrics={
														savedViewableMetrics
													}
													showHeader={ false }
												/>
											</Cell>
										</Row>
									</Grid>
								</Layout>
							</Grid>
						) }
					</div>
				</div>
			</Fragment>
		)
	);
}
