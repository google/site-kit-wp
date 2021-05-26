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

const SurveyViewTrigger = ( { triggerID, ttl } ) => {
	const usingProxy = useSelect( ( select ) => select( CORE_SITE ).isUsingProxy() );

	useMount( () => {
		if ( usingProxy ) {
			console.debug( triggerID, ttl );
		}
	} );

	return (
		<div>
			SurveyViewTrigger
		</div>
	);
};

SurveyViewTrigger.propTypes = {
	triggerID: PropTypes.string.isRequired,
	ttl: PropTypes.number,
};

SurveyViewTrigger.defaultProps = {
	ttl: null,
};

export default SurveyViewTrigger;
