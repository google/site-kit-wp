<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Template_Renderer_Factory
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

use Google\Site_Kit\Context;

/**
 * Factory for creating Email_Template_Renderer instances.
 *
 * @since 1.170.0
 * @access private
 * @ignore
 */
class Email_Template_Renderer_Factory {

	/**
	 * Plugin context instance.
	 *
	 * @since 1.170.0
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.170.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Creates a template renderer for the provided sections payload.
	 *
	 * @since 1.170.0
	 *
	 * @param array $sections_payload Sections payload.
	 * @return Email_Template_Renderer Template renderer instance.
	 */
	public function create( array $sections_payload ) {
		return new Email_Template_Renderer( new Sections_Map( $this->context, $sections_payload ) );
	}
}
