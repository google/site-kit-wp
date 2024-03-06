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

export default function WPConsentAPIRequirement( {
	title,
	description,
	footer,
} ) {
	return (
		<div className="googlesitekit-settings-consent-mode-requirement">
			<h4>{ title }</h4>
			<p className="googlesitekit-settings-consent-mode-requirement__description">
				{ description }
			</p>
			<footer className="googlesitekit-settings-consent-mode-requirement__footer">
				{ footer }
			</footer>
		</div>
	);
}

WPConsentAPIRequirement.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.node.isRequired,
	footer: PropTypes.node.isRequired,
};
