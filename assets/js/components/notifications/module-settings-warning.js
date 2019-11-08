/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import withFilters from 'GoogleComponents/higherorder/with-filters';

/**
 * A single module. Keeps track of its own active state and settings.
 */
class ModuleSettingsWarning extends Component {
	render() {
		return null;
	}
}

export default withFilters( 'googlesitekit.ModuleSettingsWarning' )( ModuleSettingsWarning );
