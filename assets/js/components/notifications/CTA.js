/**
 * CTA component.
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
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Link from '../Link';

function CTA( {
	title,
	headerText,
	headerContent,
	description,
	ctaLink,
	ctaLabel,
	ctaLinkExternal,
	ctaType,
	error,
	onClick,
	'aria-label': ariaLabel,
	children,
} ) {
	return (
		<div
			className={ classnames( 'googlesitekit-cta', {
				'googlesitekit-cta--error': error,
			} ) }
		>
			{ ( headerText || headerContent ) && (
				<div className="googlesitekit-cta__header">
					{ headerText && (
						<h2 className="googlesitekit-cta__header_text">
							{ headerText }
						</h2>
					) }
					{ headerContent }
				</div>
			) }
			{ title && <h3 className="googlesitekit-cta__title">{ title }</h3> }
			{ description && typeof description === 'string' && (
				<p className="googlesitekit-cta__description">
					{ description }
				</p>
			) }
			{ description && typeof description !== 'string' && (
				<div className="googlesitekit-cta__description">
					{ description }
				</div>
			) }
			{ ctaLabel && ctaType === 'button' && (
				<Button
					aria-label={ ariaLabel }
					href={ ctaLink }
					onClick={ onClick }
				>
					{ ctaLabel }
				</Button>
			) }
			{ ctaLabel && ctaType === 'link' && (
				<Link
					href={ ctaLink }
					onClick={ onClick }
					aria-label={ ariaLabel }
					external={ ctaLinkExternal }
					hideExternalIndicator={ ctaLinkExternal }
					arrow
				>
					{ ctaLabel }
				</Link>
			) }
			{ children }
		</div>
	);
}

CTA.propTypes = {
	title: PropTypes.string.isRequired,
	headerText: PropTypes.string,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
	ctaLink: PropTypes.string,
	ctaLinkExternal: PropTypes.bool,
	ctaLabel: PropTypes.string,
	ctaType: PropTypes.string,
	'aria-label': PropTypes.string,
	error: PropTypes.bool,
	onClick: PropTypes.func,
	children: PropTypes.node,
	headerContent: PropTypes.node,
};

CTA.defaultProps = {
	title: '',
	headerText: '',
	headerContent: '',
	description: '',
	ctaLink: '',
	ctaLabel: '',
	ctaType: 'link',
	error: false,
	onClick: () => {},
};

export default CTA;
