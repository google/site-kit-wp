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
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_SMALL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';

export default function WPConsentAPIRequirement( {
	title,
	description,
	footer,
} ) {
	return (
		<div className="googlesitekit-settings-consent-mode-requirement">
			<Typography
				as="h4"
				className="googlesitekit-settings-consent-mode-requirement__title"
				size="medium"
				type="title"
			>
				{ title }
			</Typography>
			<P
				className="googlesitekit-settings-consent-mode-requirement__description"
				size={ SIZE_SMALL }
			>
				{ description }
			</P>
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
