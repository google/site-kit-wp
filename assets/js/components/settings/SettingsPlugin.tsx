/**
 * SettingsPlugin component.
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
 * External dependencies
 */
import { ChangeEvent, FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Layout from '@/js/components/layout/Layout';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import useViewContext from '@/js/hooks/useViewContext';
import { Cell, Grid, Row } from '@/js/material-components';
import { trackEvent } from '@/js/util';

const SettingsPlugin: FC = () => {
	const showAdminBar: boolean | undefined = useSelect(
		( select: Select ) => select( CORE_SITE ).getShowAdminBar(),
		[]
	);
	const showWPDashboardWidget: boolean | undefined = useSelect(
		( select: Select ) => select( CORE_SITE ).getShowWPDashboardWidget(),
		[]
	);

	const { setShowAdminBar, setShowWPDashboardWidget } =
		useDispatch( CORE_SITE );

	const viewContext = useViewContext();

	const onAdminBarToggle = useCallback(
		( { target }: ChangeEvent< HTMLInputElement > ) => {
			const action = target.checked
				? 'enable_admin_bar_menu'
				: 'disable_admin_bar_menu';
			setShowAdminBar( !! target.checked );
			trackEvent( viewContext, action );
		},
		[ setShowAdminBar, viewContext ]
	);

	const onWPDashboardWidgetToggle = useCallback(
		( { target }: ChangeEvent< HTMLInputElement > ) => {
			const action = target.checked
				? 'enable_wp_dashboard_widget'
				: 'disable_wp_dashboard_widget';
			setShowWPDashboardWidget( !! target.checked );
			trackEvent( viewContext, action );
		},
		[ setShowWPDashboardWidget, viewContext ]
	);

	return (
		<Layout
			className="googlesitekit-settings-meta"
			title={ __( 'Plugin settings', 'google-site-kit' ) }
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
									<Checkbox
										id="admin-bar-toggle"
										name="admin-bar-toggle"
										value="1"
										checked={ showAdminBar }
										onChange={ onAdminBarToggle }
										disabled={ showAdminBar === undefined }
										loading={ showAdminBar === undefined }
									>
										<span>
											{ __(
												'Display relevant page stats in the Admin bar',
												'google-site-kit'
											) }
										</span>
									</Checkbox>
								</div>
							</div>
						</Cell>
					</Row>
					<Row>
						<Cell size={ 12 }>
							<div className="googlesitekit-settings-module__meta-items">
								<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--nomargin">
									<Checkbox
										id="wp-dashboard-widget-toggle"
										name="wp-dashboard-widget-toggle"
										value="1"
										checked={ showWPDashboardWidget }
										onChange={ onWPDashboardWidgetToggle }
										disabled={
											showWPDashboardWidget === undefined
										}
										loading={
											showWPDashboardWidget === undefined
										}
									>
										<span>
											{ __(
												'Display the Site Kit summary widget on the WordPress Dashboard',
												'google-site-kit'
											) }
										</span>
									</Checkbox>
								</div>
							</div>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Layout>
	);
};

export default SettingsPlugin;
