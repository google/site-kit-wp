/**
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
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../../util';
import LearnMoreLink from './LearnMoreLink';

export default function Description( {
	className,
	description,
	learnMoreLink,
	additionalDescription,
	children,
} ) {
	function renderDescription() {
		if ( isValidElement( description ) ) {
			return description;
		}

		if ( 'string' === typeof description ) {
			return (
				<span
					dangerouslySetInnerHTML={ sanitizeHTML( description, {
						ALLOWED_TAGS: [ 'strong', 'em', 'br', 'a' ],
						ALLOWED_ATTR: [ 'href' ],
					} ) }
				/>
			);
		}

		return description;
	}

	return (
		<div
			className={ classnames(
				'googlesitekit-banner__description',
				className
			) }
		>
			{ renderDescription() }{ ' ' }
			{ learnMoreLink?.href && <LearnMoreLink { ...learnMoreLink } /> }
			{ additionalDescription && (
				<div className="googlesitekit-banner__additional-description">
					{ additionalDescription }
				</div>
			) }
			{ children }
		</div>
	);
}

Description.propTypes = {
	className: PropTypes.string,
	description: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
	learnMoreLink: PropTypes.shape( LearnMoreLink.propTypes ),
	additionalDescription: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.node,
	] ),
	children: PropTypes.node,
};
