/**
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
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { Grid, Cell, Row } from '../../material-components';
import Badge from '../../components/Badge';
import Layout from '../layout/Layout';
import GeminiAPIKey from '../Gemini/Settings/GeminiAPIKey';
import MemorableQuotesSwitch from '../Gemini/Settings/MemorableQuotesSwitch';
import MemorableQuotesSelection from '../Gemini/Settings/MemorableQuotesSelection';
import SiteKitAssistantSwitch from '../Gemini/Settings/SiteKitAssistantSwitch';
import { Fragment } from '@wordpress/element';

export default function SettingsCardGemini() {
	const isLoading = useSelect( ( select ) => {
		const { isResolving, hasFinishedResolution } = select( CORE_SITE );

		return (
			! hasFinishedResolution( 'getGeminiSettings' ) ||
			isResolving( 'getGeminiSettings' )
		);
	} );

	return (
		<Layout
			title={ __( 'Gemini Tools', 'google-site-kit' ) }
			badge={
				<Badge
					className="googlesitekit-badge--warning"
					label={ __( 'Experimental', 'google-site-kit' ) }
				/>
			}
			header
			rounded
		>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-gemini">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<GeminiAPIKey />
						</Cell>
					</Row>
					{ ! isLoading && (
						<Fragment>
							<Row>
								<Cell
									size={ 12 }
									className={ classNames( {
										'googlesitekit-overflow-hidden':
											isLoading,
									} ) }
								>
									<MemorableQuotesSwitch
										loading={ isLoading }
									/>
								</Cell>
								<Cell size={ 12 }>
									<MemorableQuotesSelection
										loading={ isLoading }
									/>
								</Cell>
							</Row>
							<Row>
								<Cell
									size={ 12 }
									className={ classNames( {
										'googlesitekit-overflow-hidden':
											isLoading,
									} ) }
								>
									<SiteKitAssistantSwitch
										loading={ isLoading }
									/>
								</Cell>
							</Row>
						</Fragment>
					) }
				</Grid>
			</div>
		</Layout>
	);
}
