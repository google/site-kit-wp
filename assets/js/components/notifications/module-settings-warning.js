import { Component } from '@wordpress/element';

/**
 * WordPress dependencies.
 */
import { withFilters } from '@wordpress/components';

/**
 * A single module. Keeps track of its own active state and settings.
 */
class ModuleSettingsWarning extends Component {
	render() {
		return null;
	}
}

export default withFilters( 'googlesitekit.ModuleSettingsWarning' )( ModuleSettingsWarning );
