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
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
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
import UserInputQuestionnaire from '../user-input/UserInputQuestionnaire';

export default function FullScreenMetricSelectionApp() {
	const conversionReportingEnabled = isFeatureEnabled(
		'conversionReporting'
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const mainDashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const hasFinishedGettingInputSettings = useSelect( ( select ) => {
		select( CORE_USER ).getUserInputSettings();

		return select( CORE_USER ).hasFinishedResolution(
			'getUserInputSettings'
		);
	} );

	let renderPage = false;

	const isKeyMetricsSetupCompleted = useSelect( ( select ) =>
		select( CORE_SITE ).isKeyMetricsSetupCompleted()
	);

	useEffect( () => {
		if (
			( ! conversionReportingEnabled || isKeyMetricsSetupCompleted ) &&
			mainDashboardURL
		) {
			navigateTo( mainDashboardURL );
		}

		renderPage = true;
	}, [ isKeyMetricsSetupCompleted, renderPage ] );

	return (
		renderPage && (
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
												lgSize={ 6 }
												mdSize={ 8 }
												smSize={ 4 }
											>
												<PageHeader
													className="googlesitekit-heading-3 googlesitekit-user-input__heading"
													title={ __(
														'Customize Site Kit to match your goals',
														'google-site-kit'
													) }
													fullWidth
												/>
											</Cell>
											<Cell
												lgSize={ 6 }
												mdSize={ 8 }
												smSize={ 4 }
											>
												<span className="googlesitekit-user-input__subtitle">
													{ __(
														'Get metrics and suggestions that are specific to your site by telling Site Kit more about your site',
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
												mdSize={ 8 }
												smSize={ 4 }
											>
												<UserInputQuestionnaire />
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
