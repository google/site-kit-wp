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
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import OptIn from '@/js/components/OptIn';
import Header from '@/js/components/Header';
import Layout from '@/js/components/layout/Layout';
import Link from '@/js/components/Link';
import HelpMenu from '@/js/components/help/HelpMenu';
import SideKickSVG from '@/svg/graphics/view-only-setup-sidekick.svg';
import { SHARED_DASHBOARD_SPLASH_ITEM_KEY } from './constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { Grid, Row, Cell } from '@/js/material-components';
import { trackEvent } from '@/js/util';
import useViewContext from '@/js/hooks/useViewContext';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';

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
												<Typography
													as="h1"
													className="googlesitekit-setup__title"
													size="large"
													type="headline"
												>
													{ __(
														'View-only Dashboard Access',
														'google-site-kit'
													) }
												</Typography>
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
												<P>
													{ __(
														'Get insights about how people find and use your site as well as how to improve and monetize your content, directly in your WordPress dashboard',
														'google-site-kit'
													) }
												</P>

												<OptIn />

												<div className="googlesitekit-start-setup-wrap">
													<Button
														onClick={
															onButtonClick
														}
													>
														{ __(
															'Go to dashboard',
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
