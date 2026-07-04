<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class Publication extends \Google\Collection
{
  /**
   * This value is used if the state is omitted.
   */
  public const ONBOARDING_STATE_ONBOARDING_STATE_UNSPECIFIED = 'ONBOARDING_STATE_UNSPECIFIED';
  /**
   * Publication exists but is inactive, user must return to their admin console
   * to either finish their setup or address a configuration error.
   */
  public const ONBOARDING_STATE_ONBOARDING_ACTION_REQUIRED = 'ONBOARDING_ACTION_REQUIRED';
  /**
   * Publication is pending an external verification step. No immediate action
   * is required.
   */
  public const ONBOARDING_STATE_PENDING_VERIFICATION = 'PENDING_VERIFICATION';
  /**
   * Publication onboarding is complete and ready to serve end users.
   */
  public const ONBOARDING_STATE_ONBOARDING_COMPLETE = 'ONBOARDING_COMPLETE';
  protected $collection_key = 'verifiedDomains';
  protected $contentPolicyStatusType = ContentPolicyStatus::class;
  protected $contentPolicyStatusDataType = '';
  /**
   * The publication's readable name.
   *
   * @var string
   */
  public $displayName;
  /**
   * Current onboarding state of the Publication.
   *
   * @var string
   */
  public $onboardingState;
  protected $paymentOptionsType = PaymentOptions::class;
  protected $paymentOptionsDataType = '';
  protected $productsType = Product::class;
  protected $productsDataType = 'array';
  /**
   * Unique key for publications within SwG.
   *
   * @var string
   */
  public $publicationId;
  /**
   * Domains for which ownerhip has been verified with Search Console.
   *
   * @var string[]
   */
  public $verifiedDomains;

  /**
   * Reports whether a publication has any active or pending content policy
   * violations.
   *
   * @param ContentPolicyStatus $contentPolicyStatus
   */
  public function setContentPolicyStatus(ContentPolicyStatus $contentPolicyStatus)
  {
    $this->contentPolicyStatus = $contentPolicyStatus;
  }
  /**
   * @return ContentPolicyStatus
   */
  public function getContentPolicyStatus()
  {
    return $this->contentPolicyStatus;
  }
  /**
   * The publication's readable name.
   *
   * @param string $displayName
   */
  public function setDisplayName($displayName)
  {
    $this->displayName = $displayName;
  }
  /**
   * @return string
   */
  public function getDisplayName()
  {
    return $this->displayName;
  }
  /**
   * Current onboarding state of the Publication.
   *
   * Accepted values: ONBOARDING_STATE_UNSPECIFIED, ONBOARDING_ACTION_REQUIRED,
   * PENDING_VERIFICATION, ONBOARDING_COMPLETE
   *
   * @param self::ONBOARDING_STATE_* $onboardingState
   */
  public function setOnboardingState($onboardingState)
  {
    $this->onboardingState = $onboardingState;
  }
  /**
   * @return self::ONBOARDING_STATE_*
   */
  public function getOnboardingState()
  {
    return $this->onboardingState;
  }
  /**
   * The payment option used by a SwG Publication.
   *
   * @param PaymentOptions $paymentOptions
   */
  public function setPaymentOptions(PaymentOptions $paymentOptions)
  {
    $this->paymentOptions = $paymentOptions;
  }
  /**
   * @return PaymentOptions
   */
  public function getPaymentOptions()
  {
    return $this->paymentOptions;
  }
  /**
   * SwG products.
   *
   * @param Product[] $products
   */
  public function setProducts($products)
  {
    $this->products = $products;
  }
  /**
   * @return Product[]
   */
  public function getProducts()
  {
    return $this->products;
  }
  /**
   * Unique key for publications within SwG.
   *
   * @param string $publicationId
   */
  public function setPublicationId($publicationId)
  {
    $this->publicationId = $publicationId;
  }
  /**
   * @return string
   */
  public function getPublicationId()
  {
    return $this->publicationId;
  }
  /**
   * Domains for which ownerhip has been verified with Search Console.
   *
   * @param string[] $verifiedDomains
   */
  public function setVerifiedDomains($verifiedDomains)
  {
    $this->verifiedDomains = $verifiedDomains;
  }
  /**
   * @return string[]
   */
  public function getVerifiedDomains()
  {
    return $this->verifiedDomains;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Publication::class, 'Google_Service_SubscribewithGoogle_Publication');
