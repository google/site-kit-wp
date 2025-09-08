<?php
/**
 * Class Google\Site_Kit\Core\Proactive_User_Engagement\Proactive_User_Engagement
 *
 * @package   Google\Site_Kit\Core\Proactive_User_Engagement
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Proactive_User_Engagement;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Base class for Proactive User Engagement feature.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Proactive_User_Engagement {

	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	protected $context;

	/**
	 * Proactive_User_Engagement_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Proactive_User_Engagement_Settings
	 */
	protected $settings;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context      $context      Plugin context.
	 * @param Options|null $options      Optional. Options instance. Default is a new instance.
	 */
	public function __construct( Context $context, ?Options $options = null ) {
		$this->context  = $context;
		$options        = $options ?: new Options( $context );
		$this->settings = new Proactive_User_Engagement_Settings( $options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->settings->register();
	}
}
