<?php

namespace Google\Site_Kit\Core\CLI;

use Google\Site_Kit\Core\Util\Feature_Flags;
use WP_CLI\Formatter;

class Feature_Flags_CLI_Command extends CLI_Command {

	/**
	 * Gets all feature flags.
	 *
	 * @subcommand list
	 */
	public function _list( $args, $assoc_args ) {
		$features = array_map(
			function ( $feature ) {
				return array(
					'name'   => $feature,
					'status' => Feature_Flags::enabled( $feature ) ? 'active' : 'inactive',
				);
			},
			Feature_Flags::get_available_features()
		);

		$formatter = new Formatter( $assoc_args, array( 'name', 'status' ) );
		$formatter->display_items( $features );
	}
}
