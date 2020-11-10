/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * A single module. Keeps track of its own active state and settings.
 */
class ModuleSettingsWarning extends Component {
	render() {
		return null;
	}
}

export default withFilters( 'googlesitekit.ModuleSettingsWarning' )( ModuleSettingsWarning );
