<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\DatapointTestCase
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Adsense as Google_Service_Adsense;

/**
 * Shared AdSense datapoint test setup.
 */
abstract class DatapointTestCase extends TestCase {
	/**
	 * AdSense instance.
	 *
	 * @var AdSense
	 */
	protected $adsense;

	/**
	 * AdSense service instance.
	 *
	 * @var Google_Service_Adsense
	 */
	protected $service;

	public function set_up() {
		parent::set_up();

		$context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options        = new Options( $context );
		$user           = $this->factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		$user_options   = new User_Options( $context, $user->ID );
		$authentication = new Authentication( $context, $options, $user_options );
		$this->adsense  = new AdSense( $context, $options, $user_options, $authentication );

		wp_set_current_user( $user->ID );
		do_action( 'wp_login', $user->user_login, $user );

		$authentication->get_oauth_client()->set_granted_scopes( $this->adsense->get_scopes() );
		$this->adsense->get_client()->withDefer( true );
		$this->service = new Google_Service_Adsense( $this->adsense->get_client() );
	}
}
