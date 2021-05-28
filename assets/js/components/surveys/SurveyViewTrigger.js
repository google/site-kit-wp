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
			triggerSurvey( { triggerID, ttl } );
		}
	} );

	return null;
};

SurveyViewTrigger.propTypes = {
	triggerID: PropTypes.string.isRequired,
	ttl: PropTypes.number,
};

SurveyViewTrigger.defaultProps = {
	ttl: null,
};

export default SurveyViewTrigger;
