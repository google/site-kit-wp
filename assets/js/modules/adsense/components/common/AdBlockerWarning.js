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
import Data from 'googlesitekit-data';

import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import AdBlockerWarningMessage from '../../../../components/AdBlockerWarningMessage';
const { useSelect } = Data;

export default function AdBlockerWarning( { context = '' } ) {
	const adBlockerWarningMessage = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockerWarningMessage()
	);
	const getHelpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'adsense-ad-blocker-detected'
		)
	);

	return (
		<AdBlockerWarningMessage
			context={ context }
			getHelpLink={ getHelpLink }
			warningMessage={ adBlockerWarningMessage }
		/>
	);
}

AdBlockerWarning.propTypes = {
	context: PropTypes.string,
};
