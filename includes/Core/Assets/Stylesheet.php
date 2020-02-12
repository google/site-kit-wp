<?php
/**
 * Class Google\Site_Kit\Core\Assets\Stylesheet
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

/**
 * Class representing a single stylesheet.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Stylesheet extends Asset {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $handle Unique stylesheet handle.
	 * @param array  $args {
	 *     Associative array of stylesheet arguments.
	 *
	 *     @type string   $src          Required stylesheet source URL.
	 *     @type array    $dependencies List of stylesheet dependencies. Default empty array.
	 *     @type string   $version      Stylesheet version. Default is the version of Site Kit.
	 *     @type bool     $fallback     Whether to only register as a fallback. Default false.
	 *     @type callable $before_print Optional callback to execute before printing. Default none.
	 *     @type string   $media        Media for which the stylesheet is defined. Default 'all'.
	 * }
	 */
	public function __construct( $handle, array $args ) {
		parent::__construct( $handle, $args );

		$this->args = wp_parse_args(
			$this->args,
			array(
				'media' => 'all',
			)
		);
	}

	/**
	 * Registers the stylesheet.
	 *
	 * @since 1.0.0
	 */
	public function register() {
		if ( $this->args['fallback'] && wp_style_is( $this->handle, 'registered' ) ) {
			return;
		}

		wp_register_style(
			$this->handle,
			$this->args['src'],
			(array) $this->args['dependencies'],
			$this->args['version'],
			$this->args['media']
		);
	}

	/**
	 * Enqueues the stylesheet.
	 *
	 * @since 1.0.0
	 */
	public function enqueue() {
		wp_enqueue_style( $this->handle );
	}
}
