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
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import Layout from '@/js/components/layout/Layout';
import { Grid, Cell, Row } from '@/js/material-components';
import OptIn from '@/js/components/OptIn';
import ResetButton from '@/js/components/ResetButton';
import SettingsCardConsentMode from './SettingsCardConsentMode';
import SettingsCardKeyMetrics from './SettingsCardKeyMetrics';
import SettingsCardEmailReporting from './SettingsCardEmailReporting';
import SettingsPlugin from './SettingsPlugin';
import ConnectedIcon from '@/svg/icons/connected.svg';
import PreviewBlock from '@/js/components/PreviewBlock';
import SettingsCardVisitorGroups from '@/js/modules/analytics-4/components/audience-segmentation/settings/SettingsCardVisitorGroups';
import { useFeature } from '@/js/hooks/useFeature';

export default function SettingsAdmin() {
	const proactiveUserEngagementEnabled = useFeature(
		'proactiveUserEngagement'
	);

	const configuredAudiences = useSelect( ( select ) =>
		select( CORE_USER ).getConfiguredAudiences()
	);
	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
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
				[ MODULE_SLUG_ANALYTICS_4 ]
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
			<Cell size={ 12 }>
				<SettingsCardConsentMode />
			</Cell>

			{ showKeyMetricsSettings && (
				<Cell size={ 12 }>
					<SettingsCardKeyMetrics />
				</Cell>
			) }

			{ ( isAnalyticsConnected || !! configuredAudiences ) && (
				<Cell size={ 12 }>
					<SettingsCardVisitorGroups />
				</Cell>
			) }

			{ proactiveUserEngagementEnabled && (
				<Cell size={ 12 }>
					<SettingsCardEmailReporting />
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
