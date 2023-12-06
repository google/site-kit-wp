/**
 * AdSense Setup Account Site UI component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Data from 'googlesitekit-data';
import { SpinnerButton } from 'googlesitekit-components';
import { CORE_LOCATION } from '../../../../../googlesitekit/datastore/location/constants';
import { ErrorNotices } from '../../common';
import SetupUseSnippetSwitch from '../SetupUseSnippetSwitch';
import Link from '../../../../../components/Link';
import { MODULES_ADSENSE } from '../../../datastore/constants';
const { useSelect } = Data;
export default function SetupAccountSiteUI( {
	heading,
	description,
	primaryButton,
	secondaryButton,
} ) {
	const isSaving = useSelect(
		( select ) =>
			select( MODULES_ADSENSE ).isDoingSubmitChanges() ||
			select( CORE_LOCATION ).isNavigating()
	);

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ heading }
			</h3>

			<ErrorNotices />

			<p>{ description }</p>

			<SetupUseSnippetSwitch />

			<div className="googlesitekit-setup-module__action">
				<SpinnerButton
					onClick={ primaryButton.onClick }
					href={ primaryButton.href }
					disabled={ isSaving }
					isSaving={ isSaving }
				>
					{ primaryButton.label }
				</SpinnerButton>
				{ secondaryButton && (
					<div className="googlesitekit-setup-module__sub-action">
						<Link onClick={ secondaryButton.onClick }>
							{ secondaryButton.label }
						</Link>
					</div>
				) }
			</div>
		</Fragment>
	);
}

SetupAccountSiteUI.propTypes = {
	heading: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	primaryButton: PropTypes.shape( {
		label: PropTypes.string,
		href: PropTypes.string,
		onClick: PropTypes.func,
	} ).isRequired,
	secondaryButton: PropTypes.shape( {
		label: PropTypes.string,
		onClick: PropTypes.func,
	} ),
};
