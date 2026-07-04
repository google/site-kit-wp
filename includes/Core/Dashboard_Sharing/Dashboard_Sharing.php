<?php
/**
 * Class Google\Site_Kit\Core\Dashboard_Sharing\Dashboard_Sharing
 *
 * @package   Google\Site_Kit\Core\Dashboard_Sharing
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Dashboard_Sharing;

use Google\Site_Kit\Context;

/**
 * Class for handling Dashboard Sharing.
 *
 * @since 1.82.0
 * @access private
 * @ignore
 */
class Dashboard_Sharing {
	/**
	 * View_Only_Pointer instance.
	 *
	 * @since 1.83.0
	 * @var View_Only_Pointer
	 */
	protected $view_only_pointer;

	/**
	 * Constructor.
	 *
	 * @since 1.82.0
	 * @since 1.158.0 Remove $user_options and $context params.
	 * @since 1.166.0 Restore $context param.
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->view_only_pointer = new View_Only_Pointer( $context );
	}

	/**
	 * Registers functionality.
	 *
	 * @since 1.82.0
	 */
	public function register() {
		$this->view_only_pointer->register();
	}
}
