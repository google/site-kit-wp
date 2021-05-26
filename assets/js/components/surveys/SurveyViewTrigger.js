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
const { useSelect } = Data;

// TODO - in execution: https://github.com/google/site-kit-wp/issues/3355
const triggerSurvey = ( args ) => {
	// eslint-disable-next-line no-console
	console.log( ...args );
};

const SurveyViewTrigger = ( { triggerID, ttl } ) => {
	const usingProxy = useSelect( ( select ) => select( CORE_SITE ).isUsingProxy() );

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
