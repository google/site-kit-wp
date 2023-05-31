/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Header from '../../../../components/Header';
import HelpMenu from '../../../../components/help/HelpMenu';
import Layout from '../../../../components/layout/Layout';
import { Cell, Grid, Row } from '../../../../material-components';
import PageHeader from '../../../../components/PageHeader';
import AdBlockingSetupSVG from '../../../../../svg/graphics/ad-blocking-recovery-setup.svg';
import Link from '../../../../components/Link';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function AdBlockingRecoveryApp() {
	const breakpoint = useBreakpoint();

	const settingsURL = useSelect(
		( select ) =>
			`${ select( CORE_SITE ).getAdminURL(
				'googlesitekit-settings'
			) }#/connected-services/adsense`
	);

	const isTabletWidthOrLarger = breakpoint !== BREAKPOINT_SMALL;

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			<div className="googlesitekit-ad-blocking-recovery googlesitekit-module-page">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout rounded>
								<Grid>
									<Row>
										<Cell
											lgSize={ 6 }
											mdSize={ 8 }
											smSize={ 4 }
										>
											<PageHeader
												className="googlesitekit-heading-3 googlesitekit-ad-blocking-recovery__heading"
												title={ __(
													'Ad Blocking Recovery',
													'google-site-kit'
												) }
												fullWidth
											/>
										</Cell>
									</Row>
								</Grid>

								<Grid className="googlesitekit-ad-blocking-recovery__content">
									<Row>
										<Cell mdSize={ 6 } lgSize={ 8 }>
											(Placeholer: Stepper component can
											go here.)
										</Cell>

										{ isTabletWidthOrLarger && (
											<Cell
												className="googlesitekit-ad-blocking-recovery__hero-graphic"
												mdSize={ 2 }
												lgSize={ 4 }
											>
												<AdBlockingSetupSVG />
											</Cell>
										) }
									</Row>
								</Grid>

								<div className="googlesitekit-ad-blocking-recovery__footer googlesitekit-ad-blocking-recovery__buttons">
									<div className="googlesitekit-ad-blocking-recovery__footer-cancel">
										<Link href={ settingsURL }>
											{ __(
												'Cancel',
												'google-site-kit'
											) }
										</Link>
									</div>
								</div>
							</Layout>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
