<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\Publication_NormalizerTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Modules\Reader_Revenue_Manager\Publication_Normalizer;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit_Dependencies\Google\Service\SubscribewithGoogle\Publication as Legacy_Publication;
use Google\Site_Kit_Dependencies\Google\Service\Webcontentpublisher\Publication;

/**
 * @group Modules
 * @group Reader_Revenue_Manager
 * @group Datapoints
 */
class Publication_NormalizerTest extends TestCase {

	public function test_normalize() {
		$publication = new Publication(
			array(
				'additionalDomains'           => array(
					array(
						'ownershipVerified' => true,
						'url'               => 'https://other.example.com',
					),
				),
				'contentPolicyStatus'         => array(
					'policyInfoUrl' => 'https://example.com/policy',
					'state'         => 'VIOLATION_ACTIVE',
				),
				'onboardingState'             => 'COMPLETE',
				'organizationId'              => 'organization-1',
				'paymentOption'               => 'SUBSCRIPTIONS',
				'primaryDomain'               => array(
					'ownershipVerified' => true,
					'url'               => 'https://example.com',
				),
				'products'                    => array( 'basic', 'premium' ),
				'publicationId'               => 'publication-1',
				'publicationPrivacyPolicyUrl' => 'https://example.com/privacy',
				'publicationTosUrl'           => 'https://example.com/terms',
				'regionCode'                  => 'US',
				'rrmProduct'                  => array(
					'productTosUrl' => 'https://example.com/product-terms',
				),
			)
		);

		$normalized = Publication_Normalizer::normalize( $publication );

		$this->assertInstanceOf( Legacy_Publication::class, $normalized, 'The normalized resource should use the legacy publication model.' );
		$this->assertSame( 'ONBOARDING_COMPLETE', $normalized->getOnboardingState(), 'The onboarding state should use the legacy value.' );
		$this->assertSame( array( 'basic', 'premium' ), wp_list_pluck( $normalized->getProducts(), 'name' ), 'Products should use the legacy resource shape.' );
		$this->assertTrue( $normalized->getPaymentOptions()->getSubscriptions(), 'The payment option should use the legacy object shape.' );
		$this->assertSame( 'CONTENT_POLICY_VIOLATION_ACTIVE', $normalized->getContentPolicyStatus()->getContentPolicyState(), 'The content policy state should use the legacy key and value.' );
		$this->assertSame( 'https://example.com/policy', $normalized->getContentPolicyStatus()->getPolicyInfoLink(), 'The policy URL should use the legacy key.' );
		$this->assertSame( array( 'https://example.com', 'https://other.example.com' ), $normalized->getVerifiedDomains(), 'Verified domains should use the legacy URL list.' );
		$this->assertSame( 'organization-1', $normalized['organizationId'], 'New API fields should be preserved.' );
		$this->assertSame( 'US', $normalized['regionCode'], 'New API fields should be preserved.' );
		$this->assertSame( 'SUBSCRIPTIONS', $normalized['paymentOption'], 'New fields that have legacy aliases should also be preserved.' );
		$this->assertSame( 'https://example.com/terms', $normalized['publicationTosUrl'], 'The publication ToS URL should be preserved.' );
		$this->assertSame( 'https://example.com/privacy', $normalized['publicationPrivacyPolicyUrl'], 'The privacy policy URL should be preserved.' );
		$this->assertSame( 'https://example.com/product-terms', $normalized['rrmProduct']['productTosUrl'], 'The product ToS URL should be preserved.' );
	}
}
