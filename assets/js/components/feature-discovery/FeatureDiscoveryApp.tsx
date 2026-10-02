/**
 * Feature Discovery App component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import useFeatureCountCache from '@/js/components/feature-discovery/useFeatureCountCache';
import Header from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import Layout from '@/js/components/layout/Layout';
import Typography from '@/js/components/Typography';
import {
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_HEADLINE,
	TYPE_LABEL,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { BREAKPOINT_SMALL, useBreakpoint } from '@/js/hooks/useBreakpoint';
import { Cell, Grid, Row } from '@/js/material-components';
import AllServicesTab from './all-services/AllServicesTab';
import FeatureDetailPanel from './detail/FeatureDetailPanel';
import FeatureDiscoveryContent, {
	type FeatureDiscoveryTab,
} from './FeatureDiscoveryContent';
import WhatsNewTab from './whats-new/WhatsNewTab';

const FEATURE_DISCOVERY_TABS: FeatureDiscoveryTab[] = [
	{
		Component: AllServicesTab,
		label: __( 'All services and features', 'google-site-kit' ),
		panelID: 'googlesitekit-feature-discovery-all-services-tab-panel',
		path: '/all-services',
		tabID: 'googlesitekit-feature-discovery-all-services-tab',
	},
	{
		Component: WhatsNewTab,
		label: __( 'What’s new?', 'google-site-kit' ),
		panelID: 'googlesitekit-feature-discovery-whats-new-tab-panel',
		path: '/whats-new',
		tabID: 'googlesitekit-feature-discovery-whats-new-tab',
	},
];

const FeatureDiscoveryApp: FC = () => {
	useFeatureCountCache();

	const breakpoint = useBreakpoint();
	const location = useLocation();

	const activeTabIndex = FEATURE_DISCOVERY_TABS.findIndex(
		( { path } ) => path === location.pathname
	);

	const isExplicitTab = activeTabIndex > -1;
	const activeIndex = isExplicitTab ? activeTabIndex : undefined;

	const size = breakpoint === BREAKPOINT_SMALL ? SIZE_SMALL : SIZE_MEDIUM;

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			<div className="googlesitekit-module-page googlesitekit-feature-discovery">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<Layout rounded>
								<div className="googlesitekit-feature-discovery__header">
									<Typography
										as="h1"
										className="googlesitekit-feature-discovery__title"
										size={ size }
										type={ TYPE_HEADLINE }
									>
										{ __(
											'Drive your site’s success',
											'google-site-kit'
										) }
									</Typography>
									<P className="googlesitekit-feature-discovery__description">
										{ __(
											'Discover features built to help your site succeed and take control of your site’s growth. Turn on additional features and tools to uncover deeper insights about your audience, simplify your reporting, and reach your goals faster.',
											'google-site-kit'
										) }
									</P>
								</div>
								<TabBar
									activeIndex={ activeIndex }
									className="googlesitekit-tab-bar--start-aligned-high-contrast googlesitekit-feature-discovery__tab-bar"
								>
									{ FEATURE_DISCOVERY_TABS.map(
										( { path, tabID, panelID, label } ) => (
											<Tab
												aria-controls={ panelID }
												className="googlesitekit-feature-discovery__tab"
												focusOnActivate={ false }
												id={ tabID }
												key={ path }
												// @ts-expect-error Tab does not type the props forwarded to Link.
												replace={
													location.pathname === path
												}
												tag={ Link }
												to={ path }
											>
												<Typography
													className="mdc-tab__text-label"
													size={ size }
													type={ TYPE_LABEL }
												>
													{ label }
												</Typography>
											</Tab>
										)
									) }
								</TabBar>
								<div className="googlesitekit-feature-discovery__content">
									<FeatureDiscoveryContent
										tabs={ FEATURE_DISCOVERY_TABS }
										isExplicitTab={ isExplicitTab }
									/>
								</div>
							</Layout>
						</Cell>
					</Row>
				</Grid>
				<FeatureDetailPanel />
			</div>
		</Fragment>
	);
};

export default FeatureDiscoveryApp;
