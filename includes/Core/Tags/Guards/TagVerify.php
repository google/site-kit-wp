<?php
/**
 * Class Google\Site_Kit\Core\Tags\Guards\TagVerify
 *
 * @package   Google\Site_Kit\Core\Tags\Guards
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\Guards;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Guards\Guard_Interface;

/**
 * Guard that verifies if the "tagverify" query arg is used.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class TagVerify implements Guard_Interface {

	/**
	 * Plugin context.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Determines whether the guarded tag can be activated or not.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool|WP_Error TRUE if guarded tag can be activated, otherwise FALSE or an error.
	 */
	public function can_activate() {
		return ! $this->context->input()->filter( INPUT_GET, 'tagverify', FILTER_VALIDATE_BOOLEAN );
	}

}
