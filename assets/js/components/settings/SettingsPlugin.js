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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Checkbox } from 'googlesitekit-components';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { Cell, Grid, Row } from '../../material-components';
import Layout from '../layout/Layout';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

export default function SettingsPlugin() {
	const showAdminBar = useSelect( ( select ) =>
		select( CORE_SITE ).getShowAdminBar()
	);

	const { setShowAdminBar } = useDispatch( CORE_SITE );

	const viewContext = useViewContext();

	const onAdminBarToggle = useCallback(
		( { target } ) => {
			const action = target.checked
				? 'enable_admin_bar_menu'
				: 'disable_admin_bar_menu';
			setShowAdminBar( !! target.checked );
			trackEvent( viewContext, action );
		},
		[ setShowAdminBar, viewContext ]
	);

	return (
		<Layout
			className="googlesitekit-settings-meta"
			title={ __( 'Plugin Settings', 'google-site-kit' ) }
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
				</Grid>
			</div>
		</Layout>
	);
}
