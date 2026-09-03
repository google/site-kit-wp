<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\SynchronizationTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Cron;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\CTA;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication;
use Google\Site_Kit\Tests\TestCase;
use ReflectionFunction;
use ReflectionProperty;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class SynchronizationTest extends TestCase {

	/**
	 * Reader Revenue Manager module.
	 *
	 * @var Reader_Revenue_Manager
	 */
	private $module;

	/**
	 * Synchronization registrar.
	 *
	 * @var Synchronization
	 */
	private $synchronization;

	public function set_up() {
		parent::set_up();

		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options      = new Options( $context );
		$user_options = new User_Options( $context );

		$this->module          = new Reader_Revenue_Manager( $context, $options, $user_options );
		$this->synchronization = new Synchronization( $this->module, $user_options );

		$this->module->get_settings()->register();
		$this->module->get_settings()->merge( array( 'publicationID' => 'publication-1' ) );

		remove_all_actions( Publication::CRON_SYNCHRONIZE_PUBLICATION );
		wp_clear_scheduled_hook( Publication::CRON_SYNCHRONIZE_PUBLICATION );
		remove_all_actions( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );
		wp_clear_scheduled_hook( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );
	}

	public function tear_down() {
		wp_clear_scheduled_hook( Publication::CRON_SYNCHRONIZE_PUBLICATION );
		wp_clear_scheduled_hook( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS );

		parent::tear_down();
	}

	public function test_register__registers_publication_cron() {
		$this->assertFalse(
			has_action( Publication::CRON_SYNCHRONIZE_PUBLICATION ),
			'Publication cron should not be registered initially.'
		);

		$this->synchronization->register();

		$this->assertTrue(
			has_action( Publication::CRON_SYNCHRONIZE_PUBLICATION ),
			'Publication cron should be registered.'
		);
	}

	public function test_register__registers_cta_cron_when_feature_is_enabled() {
		$this->enable_feature( 'rrmExpressSetup' );

		$this->synchronization->register();

		$this->assertTrue(
			has_action( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS ),
			'CTA cron should be registered when the feature is enabled.'
		);
	}

	public function test_register__does_not_register_cta_cron_when_feature_is_disabled() {
		$this->synchronization->register();

		$this->assertFalse(
			has_action( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS ),
			'CTA cron should not be registered when the feature is disabled.'
		);
	}

	/**
	 * @dataProvider data_admin_page_load_hooks
	 *
	 * @param string $hook Admin page load hook.
	 */
	public function test_register__schedules_publication_cron_on_admin_page_load( $hook ) {
		$this->synchronization->register();
		do_action( $hook );

		$this->assertNotFalse(
			wp_next_scheduled( Publication::CRON_SYNCHRONIZE_PUBLICATION ),
			'Publication cron should be scheduled after an applicable admin page loads.'
		);
	}

	public function data_admin_page_load_hooks() {
		return array(
			'dashboard' => array( 'load-toplevel_page_googlesitekit-dashboard' ),
			'settings'  => array( 'load-toplevel_page_googlesitekit-settings' ),
		);
	}

	public function test_register__does_not_schedule_publication_cron_when_disconnected() {
		$this->module->get_settings()->merge( array( 'publicationID' => '' ) );

		$this->synchronization->register();
		do_action( 'load-toplevel_page_googlesitekit-dashboard' );

		$this->assertFalse(
			wp_next_scheduled( Publication::CRON_SYNCHRONIZE_PUBLICATION ),
			'Publication cron should not be scheduled for a disconnected module.'
		);
	}

	public function test_register__schedules_cta_cron_when_feature_is_enabled() {
		$this->enable_feature( 'rrmExpressSetup' );

		$this->synchronization->register();
		do_action( 'load-toplevel_page_googlesitekit-dashboard' );

		$this->assertNotFalse(
			wp_next_scheduled( CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS ),
			'CTA cron should be scheduled when the feature is enabled.'
		);
	}

	/**
	 * @dataProvider data_cron_datapoints
	 *
	 * @param string $hook               Cron hook.
	 * @param bool   $enable_feature     Whether to enable rrmExpressSetup.
	 * @param array  $settings           Settings to save before registration.
	 * @param string $expected_datapoint Expected datapoint slug.
	 */
	public function test_register__cron_uses_expected_datapoint( $hook, $enable_feature, $settings, $expected_datapoint ) {
		if ( $enable_feature ) {
			$this->enable_feature( 'rrmExpressSetup' );
		}

		$this->module->get_settings()->merge( $settings );

		$this->synchronization->register();

		$this->assertSame(
			$expected_datapoint,
			$this->get_registered_cron_datapoint( $hook ),
			'The cron should use the datapoint selected during registration.'
		);
	}

	public function data_cron_datapoints() {
		return array(
			'legacy publications' => array(
				Publication::CRON_SYNCHRONIZE_PUBLICATION,
				false,
				array(),
				'publications',
			),
			'wcp publications'    => array(
				Publication::CRON_SYNCHRONIZE_PUBLICATION,
				true,
				array(),
				'publications',
			),
			'wcp publication'     => array(
				Publication::CRON_SYNCHRONIZE_PUBLICATION,
				true,
				array( 'organizationID' => 'organization-1' ),
				'publication',
			),
			'ctas'                => array(
				CTA::CRON_SYNCHRONIZE_PUBLICATION_CTAS,
				true,
				array(),
				'ctas',
			),
		);
	}

	/**
	 * Gets the datapoint registered for a cron hook.
	 *
	 * @param string $hook Cron hook.
	 * @return string Datapoint slug.
	 */
	private function get_registered_cron_datapoint( $hook ) {
		global $wp_filter;

		$callback = array_column( $wp_filter[ $hook ]->callbacks[10], 'function' )[0];
		$cron     = ( new ReflectionFunction( $callback ) )->getClosureThis();

		$datapoint = new ReflectionProperty( Cron::class, 'datapoint' );
		$datapoint->setAccessible( true );

		return $datapoint->getValue( $cron );
	}
}
