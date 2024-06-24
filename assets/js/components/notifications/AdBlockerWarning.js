/**
 * AdSense AdBlockerWarning component.
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import AdBlockerWarningMessage from './AdBlockerWarningMessage';

export default function AdBlockerWarning( { moduleSlug, className } ) {
	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( moduleSlug )
	);
	const adBlockerWarningMessage = useSelect( ( select ) =>
		select( storeName )?.getAdBlockerWarningMessage()
	);
	const getHelpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			`${ moduleSlug }-ad-blocker-detected`
		)
	);

	return (
		<AdBlockerWarningMessage
			className={ className }
			getHelpLink={ getHelpLink }
			warningMessage={ adBlockerWarningMessage }
		/>
	);
}

AdBlockerWarning.propTypes = {
	className: PropTypes.string,
	moduleSlug: PropTypes.string.isRequired,
};
