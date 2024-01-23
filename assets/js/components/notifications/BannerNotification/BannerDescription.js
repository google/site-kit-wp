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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, isValidElement } from '@wordpress/element';

/*
 * Internal dependencies
 */
import { sanitizeHTML } from '../../../util/sanitize';
import Link from '../../Link';
import { LEARN_MORE_TARGET } from './constants';

export default function BannerDescription( props ) {
	const {
		description,
		learnMoreLabel,
		learnMoreURL,
		learnMoreTarget,
		learnMoreDescription,
		onLearnMoreClick,
	} = props;

	if ( ! description ) {
		return null;
	}

	const handleLearnMore = ( event ) => {
		event.persist();
		onLearnMoreClick?.();
	};

	let learnMore;
	if ( learnMoreLabel ) {
		learnMore = (
			<Fragment>
				<Link
					onClick={ handleLearnMore }
					href={ learnMoreURL }
					external={ learnMoreTarget === LEARN_MORE_TARGET.EXTERNAL }
				>
					{ learnMoreLabel }
				</Link>
				{ learnMoreDescription }
			</Fragment>
		);
	}

	return (
		<div className="googlesitekit-publisher-win__desc">
			{ isValidElement( description ) ? (
				<Fragment>
					{ description }
					{ learnMore && <p>{ learnMore }</p> }
				</Fragment>
			) : (
				<p>
					<span
						dangerouslySetInnerHTML={ sanitizeHTML( description, {
							ALLOWED_TAGS: [ 'strong', 'em', 'br', 'a' ],
							ALLOWED_ATTR: [ 'href' ],
						} ) }
					/>{ ' ' }
					{ learnMore }
				</p>
			) }
		</div>
	);
}

BannerDescription.propTypes = {
	description: PropTypes.node,
	learnMoreURL: PropTypes.string,
	learnMoreDescription: PropTypes.string,
	learnMoreLabel: PropTypes.string,
	learnMoreTarget: PropTypes.oneOf( Object.values( LEARN_MORE_TARGET ) ),
	onLearnMoreClick: PropTypes.func,
};
