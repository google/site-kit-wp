<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints\Remove_Site_Goals_WidgetTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Analytics_4\Datapoints;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Core\REST_API\Exception\Invalid_Param_Exception;
use Google\Site_Kit\Core\REST_API\Exception\Missing_Required_Param_Exception;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Datapoints\Remove_Site_Goals_Widget;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Site_Settings;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeEcommerceEventProvider_Active;
use Google\Site_Kit\Tests\Core\Conversion_Tracking\Conversion_Event_Providers\FakeLeadEventProvider_Active;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 * @group Analytics_4
 * @group Datapoints
 */
class Remove_Site_Goals_WidgetTest extends TestCase {

	/**
	 * Remove_Site_Goals_Widget instance.
	 *
	 * @var Remove_Site_Goals_Widget
	 */
	private $datapoint;

	/**
	 * Site_Goals_Site_Settings instance.
	 *
	 * @var Site_Goals_Site_Settings
	 */
	private $site_goals_site_settings;

	/**
	 * Conversion event providers registered before the tests replace them.
	 *
	 * @var array
	 */
	private static $default_providers = array();

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$default_providers = Conversion_Tracking::$providers;
	}

	public static function tear_down_after_class() {
		parent::tear_down_after_class();

		Conversion_Tracking::$providers = self::$default_providers;
	}

	public function set_up() {
		parent::set_up();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$options      = new Options( $context );

		$site_goals_settings = new Site_Goals_Settings( $user_options );
		$site_goals_settings->register();

		$this->site_goals_site_settings = new Site_Goals_Site_Settings( $options );
		$this->site_goals_site_settings->register();
		$this->site_goals_site_settings->merge( array( 'activeWidgets' => array( 'ecommerce', 'lead' ) ) );

		Conversion_Tracking::$providers = array();

		$this->datapoint = new Remove_Site_Goals_Widget(
			array(
				'site_goals_settings'      => $site_goals_settings,
				'site_goals_site_settings' => $this->site_goals_site_settings,
				'context'                  => $context,
				'service'                  => '',
			)
		);
	}

	public function tear_down() {
		Conversion_Tracking::$providers = self::$default_providers;

		parent::tear_down();
	}

	/**
	 * Builds the request the REST route makes for one widget.
	 *
	 * @since n.e.x.t
	 *
	 * @param string|null $widget Optional. Widget category to send. Default null, which sends no widget.
	 * @return Data_Request The request for the removal datapoint.
	 */
	private function build_request( $widget = null ) {
		$data = null === $widget ? array() : array( 'widget' => $widget );

		return new Data_Request( 'POST', 'modules', 'analytics-4', 'remove-site-goals-widget', $data );
	}

	public function test_create_request__takes_the_widget_out_of_the_active_widgets() {
		$request  = $this->datapoint->create_request( $this->build_request( 'lead' ) );
		$response = $request();

		$this->assertSame( array( 'activeWidgets' => array( 'ecommerce' ) ), $response, 'The datapoint should return the widgets that are still active.' );
		$this->assertSame( array( 'ecommerce' ), $this->site_goals_site_settings->get()['activeWidgets'], 'The datapoint should store the widgets that are still active.' );
	}

	public function test_create_request__leaves_the_other_widget_active() {
		$request = $this->datapoint->create_request( $this->build_request( 'ecommerce' ) );
		$request();

		$this->assertSame( array( 'lead' ), $this->site_goals_site_settings->get()['activeWidgets'], 'Removing the ecommerce widget should leave the lead widget active.' );
	}

	public function test_create_request__throws_when_the_request_names_no_widget() {
		$this->expectException( Missing_Required_Param_Exception::class );

		$this->datapoint->create_request( $this->build_request() );
	}

	public function test_create_request__throws_for_a_widget_outside_the_allowed_list() {
		$this->expectException( Invalid_Param_Exception::class );

		$this->datapoint->create_request( $this->build_request( 'traffic' ) );
	}

	public function test_create_request__refuses_to_remove_the_ecommerce_widget_while_a_store_plugin_is_active() {
		Conversion_Tracking::$providers = array(
			FakeEcommerceEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeEcommerceEventProvider_Active::class,
		);

		$response = $this->datapoint->create_request( $this->build_request( 'ecommerce' ) );

		$this->assertWPError( $response, 'The datapoint should return an error while an ecommerce plugin is active.' );
		$this->assertSame( 'site_goals_widget_provider_active', $response->get_error_code(), 'The error code should be `site_goals_widget_provider_active`.' );
		$this->assertSame( 400, $response->get_error_data()['status'], 'The error should have a 400 status.' );
		$this->assertSame(
			array( 'ecommerce', 'lead' ),
			$this->site_goals_site_settings->get()['activeWidgets'],
			'A refused request should leave both widgets active.'
		);
	}

	public function test_create_request__removes_the_ecommerce_widget_while_only_a_form_plugin_is_active() {
		Conversion_Tracking::$providers = array(
			FakeLeadEventProvider_Active::CONVERSION_EVENT_PROVIDER_SLUG => FakeLeadEventProvider_Active::class,
		);

		$request = $this->datapoint->create_request( $this->build_request( 'ecommerce' ) );
		$request();

		$this->assertSame(
			array( 'lead' ),
			$this->site_goals_site_settings->get()['activeWidgets'],
			'An active form plugin should not stop the ecommerce widget from being removed.'
		);
	}

	public function test_is_shareable__returns_true() {
		$this->assertTrue(
			$this->datapoint->is_shareable(),
			'The removal datapoint should be shareable, so a view-only user on a shared dashboard can remove a widget for every user of the site.'
		);
	}

	public function test_permission_callback__checks_the_view_dashboard_capability() {
		$this->assertSame(
			current_user_can( Permissions::VIEW_DASHBOARD ),
			$this->datapoint->permission_callback(),
			'The datapoint should allow the same users the `googlesitekit_view_dashboard` capability allows.'
		);
	}

	public function test_parse_response__returns_the_response_unchanged() {
		$settings = array( 'activeWidgets' => array( 'lead' ) );

		$this->assertSame( $settings, $this->datapoint->parse_response( $settings, $this->build_request( 'ecommerce' ) ), 'The `parse_response` method should return the response unchanged.' );
	}
}
