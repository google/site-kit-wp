/**
 * SettingsOverview component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import Layout from '../layout/Layout';
import { Grid, Cell, Row } from '../../material-components';
import OptIn from '../OptIn';
import ResetButton from '../ResetButton';
import SettingsCardKeyMetrics from './SettingsCardKeyMetrics';
import SettingsPlugin from './SettingsPlugin';
import ConnectedIcon from '../../../svg/icons/connected.svg';
import PreviewBlock from '../PreviewBlock';
const { useSelect } = Data;

export default function SettingsAdmin() {
	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const isSearchConsoleGatheringData = useSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);
	const isAnalyticsGatheringData = useSelect( ( select ) => {
		if ( ! isAnalyticsConnected ) {
			return false;
		}

		return select( MODULES_ANALYTICS_4 ).isGatheringData();
	} );

	const showKeyMetricsSettings =
		isAnalyticsConnected &&
		isSearchConsoleGatheringData === false &&
		isAnalyticsGatheringData === false;

	const showKeyMetricsSettingsLoading = useSelect( ( select ) => {
		if (
			! select( CORE_MODULES ).hasFinishedResolution(
				'isModuleConnected',
				[ 'analytics-4' ]
			)
		) {
			return true;
		}

		// The resolvers below are never resolved if Analytics is disconnected,
		// so if it's disconnected, return early.
		//
		// Because they're never called nothing else can be loading.
		if ( isAnalyticsConnected === false ) {
			return false;
		}

		if (
			! select( MODULES_SEARCH_CONSOLE ).hasFinishedResolution(
				'isGatheringData'
			) ||
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'isGatheringData'
			)
		) {
			return true;
		}

		return false;
	} );

	// Show a loading skeleton to prevent a layout shift.
	if ( showKeyMetricsSettingsLoading ) {
		return (
			<Row>
				<Cell size={ 12 }>
					<PreviewBlock
						width="100%"
						smallHeight="100px"
						tabletHeight="100px"
						desktopHeight="200px"
					/>
				</Cell>
				<Cell size={ 12 }>
					<PreviewBlock
						width="100%"
						smallHeight="100px"
						tabletHeight="100px"
						desktopHeight="200px"
					/>
				</Cell>
				<Cell size={ 12 }>
					<PreviewBlock
						width="100%"
						smallHeight="100px"
						tabletHeight="100px"
						desktopHeight="200px"
					/>
				</Cell>
				<Cell size={ 12 }>
					<PreviewBlock
						width="100%"
						smallHeight="100px"
						tabletHeight="100px"
						desktopHeight="200px"
					/>
				</Cell>
			</Row>
		);
	}

	return (
		<Row>
			{ showKeyMetricsSettings && (
				<Cell size={ 12 }>
					<SettingsCardKeyMetrics />
				</Cell>
			) }

			<Cell size={ 12 }>
				<Layout
					title={ __( 'Plugin Status', 'google-site-kit' ) }
					header
					rounded
				>
					<div className="googlesitekit-settings-module googlesitekit-settings-module--active">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<div className="googlesitekit-settings-module__meta-items">
										<p className="googlesitekit-settings-module__status">
											{ __(
												'Site Kit is connected',
												'google-site-kit'
											) }
											<span className="googlesitekit-settings-module__status-icon googlesitekit-settings-module__status-icon--connected">
												<ConnectedIcon
													width={ 10 }
													height={ 8 }
												/>
											</span>
										</p>
									</div>
								</Cell>
							</Row>
						</Grid>

						<footer className="googlesitekit-settings-module__footer">
							<Grid>
								<Row>
									<Cell size={ 12 }>
										<ResetButton />
									</Cell>
								</Row>
							</Grid>
						</footer>
					</div>
				</Layout>
			</Cell>

			<Cell size={ 12 }>
				<SettingsPlugin />
			</Cell>

			<Cell size={ 12 }>
				<Layout
					className="googlesitekit-settings-meta"
					title={ __( 'Tracking', 'google-site-kit' ) }
					header
					fill
					rounded
				>
					<div className="googlesitekit-settings-module googlesitekit-settings-module--active">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<div className="googlesitekit-settings-module__meta-items">
										<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--nomargin">
											<OptIn />
										</div>
									</div>
								</Cell>
							</Row>
						</Grid>
					</div>
				</Layout>
			</Cell>
		</Row>
	);
}
