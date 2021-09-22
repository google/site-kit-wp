<?php
/**
 * Class Google\Site_Kit\Core\Assets\Stylesheet
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Assets;

use Google\Site_Kit\Context;

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
	 * @since 1.15.0 Adds $context parameter.
	 *
	 * @param Context $context Plugin context.
	 */
	public function register( Context $context ) {
		if ( $this->args['fallback'] && wp_style_is( $this->handle, 'registered' ) ) {
			return;
		}
		$src     = $this->args['src'];
		$version = $this->args['version'];

		$filename = Manifest::get_filename( $this->handle );

		if ( $filename ) {
			$src     = $context->url( 'dist/' . $filename );
			$version = null;
		}

		wp_register_style(
			$this->handle,
			$src,
			(array) $this->args['dependencies'],
			$version,
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
