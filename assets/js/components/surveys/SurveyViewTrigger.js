/**
 * SurveyViewTrigger component.
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
import { useMount } from 'react-use';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

const { useSelect, useDispatch } = Data;

const SurveyViewTrigger = ( { triggerID, ttl } ) => {
	const usingProxy = useSelect( ( select ) => select( CORE_SITE ).isUsingProxy() );

	const { triggerSurvey } = useDispatch( CORE_USER );

	useMount( () => {
		if ( usingProxy ) {
			triggerSurvey( triggerID, { ttl } );
		}
	} );

	return null;
};

SurveyViewTrigger.propTypes = {
	triggerID: PropTypes.string.isRequired,
	ttl: PropTypes.number,
};

SurveyViewTrigger.defaultProps = {
	ttl: 0,
};

export default SurveyViewTrigger;
