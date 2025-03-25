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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../../../../util';
import ErrorText from '../../../../components/ErrorText';

export default function Description( {
	className = 'googlesitekit-publisher-win__desc',
	text,
	learnMoreLink,
	errorText,
	children,
} ) {
	return (
		<Fragment>
			<div className={ className }>
				<p>
					<span
						dangerouslySetInnerHTML={ sanitizeHTML( text, {
							ALLOWED_TAGS: [ 'strong', 'em', 'br', 'a' ],
							ALLOWED_ATTR: [ 'href' ],
						} ) }
					/>{ ' ' }
					{ learnMoreLink }
				</p>
			</div>
			{ errorText && <ErrorText message={ errorText } /> }
			{ children }
		</Fragment>
	);
}

Description.propTypes = {
	className: PropTypes.string,
	text: PropTypes.string,
	learnMoreLink: PropTypes.node,
	errorText: PropTypes.string,
	children: PropTypes.node,
};
