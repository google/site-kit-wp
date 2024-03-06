/**
 * Layout component.
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
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LayoutHeader from './LayoutHeader';
import LayoutFooter from './LayoutFooter';

class Layout extends Component {
	render() {
		const {
			header,
			footer,
			children,
			title,
			badge,
			headerCTALabel,
			headerCTALink,
			footerCTALabel,
			footerCTALink,
			footerContent,
			className,
			fill,
			relative,
			rounded = false,
			transparent = false,
		} = this.props;

		return (
			<div
				className={ classnames( 'googlesitekit-layout', className, {
					'googlesitekit-layout--fill': fill,
					'googlesitekit-layout--relative': relative,
					'googlesitekit-layout--rounded': rounded,
					'googlesitekit-layout--transparent': transparent,
				} ) }
			>
				{ header && (
					<LayoutHeader
						title={ title }
						badge={ badge }
						ctaLabel={ headerCTALabel }
						ctaLink={ headerCTALink }
					/>
				) }
				{ children }
				{ footer && (
					<LayoutFooter
						ctaLabel={ footerCTALabel }
						ctaLink={ footerCTALink }
						footerContent={ footerContent }
					/>
				) }
			</div>
		);
	}
}

Layout.propTypes = {
	header: PropTypes.bool,
	footer: PropTypes.bool,
	children: PropTypes.node.isRequired,
	title: PropTypes.string,
	badge: PropTypes.node,
	headerCTALabel: PropTypes.string,
	headerCTALink: PropTypes.string,
	footerCTALabel: PropTypes.string,
	footerCTALink: PropTypes.string,
	footerContent: PropTypes.node,
	className: PropTypes.string,
	fill: PropTypes.bool,
	relative: PropTypes.bool,
	rounded: PropTypes.bool,
	transparent: PropTypes.bool,
};

Layout.defaultProps = {
	header: false,
	footer: false,
	title: '',
	badge: null,
	headerCTALabel: '',
	headerCTALink: '',
	footerCTALabel: '',
	footerCTALink: '',
	footerContent: null,
	className: '',
	fill: false,
	relative: false,
};

export default Layout;
