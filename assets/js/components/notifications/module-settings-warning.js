const { Component } = wp.element;

/**
 * WordPress dependencies.
 */
const { withFilters } = wp.components;

/**
 * A single module. Keeps track of its own active state and settings.
 */
class ModuleSettingsWarning extends Component {

	render() {
		return null;
	}
}

export default withFilters( 'googlesitekit.ModuleSettingsWarning' )( ModuleSettingsWarning );
