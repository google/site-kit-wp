/**
 * Settings notice SettingsNoticeSingleRow component.
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

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

export default function SettingsNoticeSingleRow( { notice, LearnMore, CTA } ) {
	return (
		<Fragment>
			<div className="googlesitekit-settings-notice__text">
				{ notice }
			</div>

			{ LearnMore && (
				<div className="googlesitekit-settings-notice__learn-more">
					<LearnMore />
				</div>
			) }

			{ CTA && (
				<div className="googlesitekit-settings-notice__cta">
					<CTA />
				</div>
			) }
		</Fragment>
	);
}

SettingsNoticeSingleRow.propTypes = {
	notice: PropTypes.node.isRequired,
	LearnMore: PropTypes.elementType,
	CTA: PropTypes.elementType,
};
