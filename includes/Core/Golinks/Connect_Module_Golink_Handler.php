<?php
/**
 * Class Google\Site_Kit\Core\Golinks\Connect_Module_Golink_Handler
 *
 * @package   Google\Site_Kit\Core\Golinks
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Golinks;

use Google\Site_Kit\Context;

/**
 * Golink handler for connecting a specific module.
 *
 * @since 1.181.0
 * @access private
 * @ignore
 */
class Connect_Module_Golink_Handler implements Golink_Handler_Interface {

	/**
	 * Module slug to connect.
	 *
	 * @since 1.181.0
	 * @var string
	 */
	private $module_slug;

	/**
	 * Constructor.
	 *
	 * @since 1.181.0
	 *
	 * @param string $module_slug Module slug to connect.
	 */
	public function __construct( string $module_slug ) {
		$this->module_slug = $module_slug;
	}

	/**
	 * Builds the module connect destination URL.
	 *
	 * @since 1.181.0
	 *
	 * @param Context $context Plugin context.
	 * @return string Destination URL.
	 */
	public function handle( Context $context ) {
		return add_query_arg(
			array(
				'slug'   => $this->module_slug,
				'reAuth' => 'true',
			),
			$context->admin_url( 'dashboard' )
		);
	}
}
