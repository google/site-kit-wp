/**
 * SetupUsingProxyViewOnly component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import {
	useCallback,
	createInterpolateElement,
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import OptIn from '../OptIn';
import Header from '../Header';
import Layout from '../layout/Layout';
import Link from '../Link';
import HelpMenu from '../help/HelpMenu';
import SideKickSVG from '../../../svg/graphics/view-only-setup-sidekick.svg';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from './constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { Grid, Row, Cell } from '../../material-components';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
const { useSelect, useDispatch } = Data;

export default function SetupUsingProxyViewOnly() {
	const viewContext = useViewContext();

	const { dismissItem } = useDispatch( CORE_USER );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'dashboard-sharing'
		);
	} );

	const onButtonClick = useCallback( () => {
		Promise.all( [
			dismissItem( SHARED_DASHBOARD_SPLASH_ITEM_KEY ),
			trackEvent( viewContext, 'confirm_viewonly' ),
		] ).finally( () => {
			navigateTo( dashboardURL );
		} );
	}, [ dashboardURL, dismissItem, navigateTo, viewContext ] );

	if ( ! dashboardURL ) {
		return null;
	}

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>

			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout rounded>
								<section className="googlesitekit-setup__splash">
									<Grid>
										<Row className="googlesitekit-setup__content">
											<Cell
												smSize={ 4 }
												mdSize={ 8 }
												lgSize={ 4 }
												lgOrder={ 2 }
												className="googlesitekit-setup__icon"
											>
												<SideKickSVG
													width={ 398 }
													height={ 280 }
												/>
											</Cell>
											<Cell
												smSize={ 4 }
												mdSize={ 8 }
												lgSize={ 8 }
												lgOrder={ 1 }
											>
												<h1 className="googlesitekit-setup__title">
													{ __(
														'View-only Dashboard Access',
														'google-site-kit'
													) }
												</h1>
												<p className="googlesitekit-setup__description">
													{ createInterpolateElement(
														__(
															"An administrator has granted you access to view this site's dashboard to view stats from all shared Google services. <a>Learn more</a>",
															'google-site-kit'
														),
														{
															a: (
																<Link
																	aria-label={ __(
																		'Learn more about dashboard sharing',
																		'google-site-kit'
																	) }
																	href={
																		documentationURL
																	}
																	external
																/>
															),
														}
													) }
												</p>
												<p>
													{ __(
														'Get insights about how people find and use your site as well as how to improve and monetize your content, directly in your WordPress dashboard',
														'google-site-kit'
													) }
												</p>

												<OptIn />

												<div className="googlesitekit-start-setup-wrap">
													<Button
														onClick={
															onButtonClick
														}
													>
														{ __(
															'Go to Dashboard',
															'google-site-kit'
														) }
													</Button>
												</div>
											</Cell>
										</Row>
									</Grid>
								</section>
							</Layout>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
