/**
 * DashboardDetailsHeader component.
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
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { decodeHTMLEntity, sanitizeHTML } from '../../util';
import Link from '../Link';
import PageHeader from '../PageHeader';
import Layout from '../layout/Layout';
import { Grid, Row, Cell } from '../../material-components/layout';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function DashboardDetailsHeader() {
	const dashboardURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );
	const currentEntityURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const currentEntityTitle = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityTitle() );
	const permaLink = useSelect( ( select ) => select( CORE_SITE ).getPermaLinkParam() );

	return (
		<Fragment>
			<Link href={ dashboardURL } inherit back small>
				{ __( 'Back to the Site Kit Dashboard', 'google-site-kit' ) }
			</Link>

			<PageHeader
				title={ __( 'Detailed Page Stats', 'google-site-kit' ) }
				className="
					googlesitekit-heading-2
					googlesitekit-dashboard-single-url__heading
				"
				fullWidth
			/>

			<Layout>
				<Grid>
					<Row>
						<Cell size={ 12 }>
							{ currentEntityURL && (
								<Fragment>
									<h3 className="
										googlesitekit-heading-3
										googlesitekit-dashboard-single-url__title
									">
										{ currentEntityTitle && decodeHTMLEntity( currentEntityTitle ) }
									</h3>
									<Link href={ currentEntityURL } inherit external>
										{ currentEntityURL }
									</Link>
								</Fragment>
							) }
							{ ! currentEntityURL && (
								<p dangerouslySetInnerHTML={ sanitizeHTML(
									sprintf(
										/* translators: %s: current entity URL */
										__( 'It looks like the URL %s is not part of this site, therefore there is no data available to display.', 'google-site-kit' ),
										`<strong>${ permaLink }</strong>`
									),
									{
										ALLOWED_TAGS: [ 'strong' ],
										ALLOWED_ATTR: [],
									}
								) } />
							) }
						</Cell>
					</Row>
				</Grid>
			</Layout>
		</Fragment>
	);
}
