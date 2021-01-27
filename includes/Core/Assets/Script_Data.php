<?php
/**
 * Class Google\Site_Kit\Core\Assets\Script_Data
 *
 * @package   Google\Site_Kit\Core\Assets
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

/**
 * Class for virtual "data-only" scripts.
 *
 * @since 1.5.0
 * @access private
 * @ignore
 */
class Script_Data extends Script {
	/**
	 * Constructor.
	 *
	 * @since 1.5.0
	 *
	 * @param string $handle Unique script handle.
	 * @param array  $args {
	 *     Associative array of script arguments.
	 *
	 *     @type callable $data_callback Required. Function to return JSON-encodable data.
	 *     @type string   $global        Required. Name of global variable to assign data to in Javascript.
	 *     @type array    $dependencies  Optional. List of script dependencies. Default empty array.
	 * }
	 */
	public function __construct( $handle, array $args ) {
		// Ensure required keys are always set.
		$args = $args + array(
			'data_callback' => null,
			'global'        => '',
		);
		// SRC will always be false.
		$args['src'] = false;

		parent::__construct( $handle, $args );

		// Lazy-load script data before handle is to be printed.
		$this->args['before_print'] = function ( $handle ) {
			if ( empty( $this->args['global'] ) || ! is_callable( $this->args['data_callback'] ) ) {
				return;
			}
			$data = call_user_func( $this->args['data_callback'], $handle );
			$this->add_script_data( $data );
		};
	}

	/**
	 * Adds the given data to the script handle's 'data' key.
	 *
	 * 'data' is the key used by `wp_localize_script`, which is output
	 * in older versions of WP even if the handle has no src (such as an alias).
	 * This is done manually instead of using `wp_localize_script` to avoid casting
	 * top-level keys to strings as this function is primarily intended for
	 * providing an array of translations to Javascript rather than arbitrary data.
	 *
	 * @see \WP_Scripts::localize
	 *
	 * @since 1.5.0
	 *
	 * @param mixed $data Data to be assigned to the defined global.
	 */
	private function add_script_data( $data ) {
		$script_data = wp_scripts()->get_data( $this->handle, 'data' ) ?: '';
		$js          = sprintf(
			'var %s = %s;',
			preg_replace( '[^\w\d_-]', '', $this->args['global'] ), // Ensure only a-zA-Z0-9_- are allowed.
			wp_json_encode( $data )
		);
		wp_scripts()->add_data( $this->handle, 'data', trim( "$script_data\n$js" ) );
	}
}
