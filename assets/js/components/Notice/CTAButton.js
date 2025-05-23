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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { SpinnerButton } from 'googlesitekit-components';
import ExternalIcon from '../../../svg/icons/external.svg';

export default function CTAButton( {
	label,
	disabled,
	inProgress,
	onClick,
	href,
	external,
	hideExternalIndicator,
} ) {
	let trailingIconToUse;
	if ( external && ! hideExternalIndicator ) {
		trailingIconToUse = <ExternalIcon width={ 14 } height={ 14 } />;
	}
	return (
		<SpinnerButton
			className="googlesitekit-notice__cta"
			disabled={ disabled }
			isSaving={ inProgress }
			onClick={ onClick }
			href={ href }
			target={ external ? '_blank' : '_self' }
			trailingIcon={ trailingIconToUse }
		>
			{ label }
		</SpinnerButton>
	);
}

// eslint-disable-next-line sitekit/acronym-case
CTAButton.propTypes = {
	label: PropTypes.string.isRequired,
	disabled: PropTypes.bool,
	inProgress: PropTypes.bool,
	onClick: PropTypes.func,
	href: PropTypes.string,
	external: PropTypes.bool,
	hideExternalIndicator: PropTypes.bool,
};
