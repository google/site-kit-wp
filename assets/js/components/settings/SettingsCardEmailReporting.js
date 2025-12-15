/**
 * SettingsCardEmailReporting component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import SettingsEmailReporting from './SettingsEmailReporting';
import Layout from '@/js/components/layout/Layout';
import { Grid, Cell, Row } from '@/js/material-components';
import PreviewBlock from '@/js/components/PreviewBlock';

export default function SettingsCardEmailReporting() {
	const isLoading = useSelect( ( select ) => {
		const { isResolving, hasFinishedResolution } = select( CORE_SITE );

		return (
			! hasFinishedResolution( 'getEmailReportingSettings' ) ||
			isResolving( 'getEmailReportingSettings' )
		);
	} );

	const settings = useSelect( ( select ) =>
		select( CORE_SITE ).getEmailReportingSettings()
	);

	return (
		<Layout
			title={ __( 'Email reports', 'google-site-kit' ) }
			header
			rounded
		>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-email-reporting">
				{ isLoading && <PreviewBlock width="100%" height="100px" /> }
				{ ! isLoading && settings !== undefined && (
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SettingsEmailReporting />
							</Cell>
						</Row>
					</Grid>
				) }
			</div>
		</Layout>
	);
}
