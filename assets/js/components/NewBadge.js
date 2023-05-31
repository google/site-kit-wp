/**
 * NewBadge component.
 *
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tooltip } from 'googlesitekit-components';
import Badge from './Badge';
import Link from './Link';

function NewBadge( {
	tooltipTitle,
	learnMoreLink,
	forceOpen,
	onLearnMoreClick = () => {},
} ) {
	return (
		<Tooltip
			tooltipClassName="googlesitekit-new-badge__tooltip"
			title={
				<Fragment>
					{ tooltipTitle }
					<br />
					<Link
						href={ learnMoreLink }
						onClick={ onLearnMoreClick }
						external
					>
						{ __( 'Learn more', 'google-site-kit' ) }
					</Link>
				</Fragment>
			}
			placement="top"
			enterTouchDelay={ 0 }
			leaveTouchDelay={ 5000 }
			interactive
			open={ forceOpen }
		>
			<Badge
				className="googlesitekit-new-badge"
				label={ __( 'New', 'google-site-kit' ) }
			/>
		</Tooltip>
	);
}

NewBadge.propTypes = {
	tooltipTitle: PropTypes.string.isRequired,
	learnMoreLink: PropTypes.string.isRequired,
	forceOpen: PropTypes.bool,
	onLearnMoreClick: PropTypes.func,
};

export default NewBadge;
