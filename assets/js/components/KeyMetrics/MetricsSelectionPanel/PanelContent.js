/**
 * Selection Panel Content
 *
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
import classnames from 'classnames';
import { noop } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CustomDimensionsNotice from './CustomDimensionsNotice';
import Header from './Header';
import Footer from './Footer';
import MetricItems from './MetricItems';
import KeyMetricsError from './KeyMetricsError';

export default function PanelContent( {
	isOpen = false,
	closePanel,
	savedViewableMetrics,
	showHeader = true,
	setIsNavigatingToOAuthURL = noop,
	isFullScreen = false,
} ) {
	return (
		<Fragment>
			{ showHeader && <Header closePanel={ closePanel } /> }
			<MetricItems savedMetrics={ savedViewableMetrics } />
			<CustomDimensionsNotice />
			<div
				className={ classnames(
					'googlesitekit-user-input__footer-container',
					{
						'googlesitekit-user-input__footer-container--fullscreen':
							isFullScreen,
					}
				) }
			>
				<KeyMetricsError savedMetrics={ savedViewableMetrics } />
				<Footer
					isOpen={ isOpen }
					closePanel={ closePanel }
					savedMetrics={ savedViewableMetrics }
					onNavigationToOAuthURL={ () => {
						setIsNavigatingToOAuthURL( true );
					} }
					isFullScreen={ isFullScreen }
				/>
			</div>
		</Fragment>
	);
}

PanelContent.propTypes = {
	isOpen: PropTypes.bool,
	closePanel: PropTypes.func,
	savedViewableMetrics: PropTypes.array,
	showHeader: PropTypes.bool,
	setIsNavigatingToOAuthURL: PropTypes.func,
	isFullScreen: PropTypes.bool,
};
