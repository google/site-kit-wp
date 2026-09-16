<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization\PublicationTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Synchronization;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Synchronization\Publication;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\ContentPolicyStatus;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication as WCP_Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 */
class PublicationTest extends TestCase {

	/**
	 * Reader Revenue Manager settings.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Publication synchronization instance.
	 *
	 * @var Publication
	 */
	private $synchronization;

	public function set_up() {
		parent::set_up();

		$this->enable_feature( 'rrmExpressSetup' );

		$this->settings = new Settings(
			new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) )
		);
		$this->settings->register();
		$this->settings->set(
			array(
				'organizationID'                    => 'old-organization',
				'publicationID'                     => 'publication-1',
				'publicationOnboardingState'        => 'ONBOARDING_ACTION_REQUIRED',
				'publicationOnboardingStateChanged' => false,
				'productIDs'                        => array(),
				'paymentOption'                     => '',
				'contentPolicyState'                => '',
				'policyInfoLink'                    => '',
			)
		);

		$this->synchronization = new Publication( $this->settings );

		wp_clear_scheduled_hook( Publication::CRON_SYNCHRONIZE_PUBLICATION );
	}

	public function tear_down() {
		wp_clear_scheduled_hook( Publication::CRON_SYNCHRONIZE_PUBLICATION );

		parent::tear_down();
	}

	public function test_synchronize__updates_publication_settings() {
		$content_policy_status = new ContentPolicyStatus();
		$content_policy_status->setState( 'VIOLATION_ACTIVE' );
		$content_policy_status->setPolicyInfoUrl( 'https://example.com/policy-info' );

		$publication = $this->create_publication();
		$publication->setOrganizationId( 'organization-1' );
		$publication->setOnboardingState( 'COMPLETE' );
		$publication->setProducts( array( 'publication-1:basic', 'publication-1:advanced', null ) );
		$publication->setPaymentOption( 'SUBSCRIPTIONS' );
		$publication->setContentPolicyStatus( $content_policy_status );

		$this->synchronization->synchronize( $publication );

		$settings = $this->settings->get();

		$this->assertSame( 'organization-1', $settings['organizationID'], 'Organization ID should be synchronized.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $settings['publicationOnboardingState'], 'Onboarding state should be synchronized.' );
		$this->assertTrue( $settings['publicationOnboardingStateChanged'], 'Onboarding state should be marked as changed.' );
		$this->assertSame( array( 'publication-1:basic', 'publication-1:advanced' ), $settings['productIDs'], 'Product IDs should be synchronized.' );
		$this->assertSame( 'subscriptions', $settings['paymentOption'], 'Payment option should be synchronized.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $settings['contentPolicyState'], 'Content policy state should be synchronized.' );
		$this->assertSame( 'https://example.com/policy-info', $settings['policyInfoLink'], 'Policy info link should be synchronized.' );
	}

	/**
	 * @dataProvider data_invalid_connected_publications
	 *
	 * @param string $connected_publication_id Connected publication ID.
	 * @param string $response_publication_id  Response publication ID.
	 */
	public function test_synchronize__ignores_unconnected_publications( $connected_publication_id, $response_publication_id ) {
		$this->settings->merge( array( 'publicationID' => $connected_publication_id ) );
		$settings_before = $this->settings->get();

		$this->synchronization->synchronize(
			$this->create_publication( $response_publication_id )
		);

		$this->assertEquals( $settings_before, $this->settings->get(), 'Settings should remain unchanged.' );
		$this->assertFalse( wp_next_scheduled( Publication::CRON_SYNCHRONIZE_PUBLICATION ), 'Cron should not be scheduled.' );
	}

	public function data_invalid_connected_publications() {
		return array(
			'missing connected publication ID' => array( '', 'publication-1' ),
			'non-matching publication ID'      => array( 'publication-1', 'publication-2' ),
		);
	}

	public function test_synchronize__does_not_mark_unchanged_onboarding_state_as_changed() {
		$this->settings->merge(
			array(
				'publicationOnboardingState'        => 'ONBOARDING_COMPLETE',
				'publicationOnboardingStateChanged' => false,
			)
		);

		$publication = $this->create_publication();
		$publication->setOnboardingState( 'COMPLETE' );

		$this->synchronization->synchronize( $publication );

		$this->assertFalse(
			$this->settings->get()['publicationOnboardingStateChanged'],
			'Unchanged onboarding state should not be marked as changed.'
		);
	}

	public function test_synchronize__reschedules_publication_cron() {
		wp_schedule_single_event(
			time() + 600,
			Publication::CRON_SYNCHRONIZE_PUBLICATION
		);
		$original_schedule = wp_next_scheduled( Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$this->synchronization->synchronize( $this->create_publication() );

		$new_schedule = wp_next_scheduled( Publication::CRON_SYNCHRONIZE_PUBLICATION );

		$this->assertNotFalse( $new_schedule, 'Cron should remain scheduled.' );
		$this->assertNotSame( $original_schedule, $new_schedule, 'Cron should be rescheduled.' );
		$this->assertGreaterThanOrEqual( time() + HOUR_IN_SECONDS - 1, $new_schedule, 'Cron should run approximately one hour from now.' );
	}

	private function create_publication( $publication_id = 'publication-1' ) {
		$publication = new WCP_Publication();
		$publication->setPublicationId( $publication_id );

		return $publication;
	}
}
