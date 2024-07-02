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
  protected $collection_key = 'verifiedDomains';
  /**
   * @var string
   */
  public $displayName;
  /**
   * @var string
   */
  public $onboardingState;
  protected $paymentOptionsType = PaymentOptions::class;
  protected $paymentOptionsDataType = '';
  protected $productsType = Product::class;
  protected $productsDataType = 'array';
  /**
   * @var string
   */
  public $publicationId;
  protected $publicationPredicatesType = PublicationPredicates::class;
  protected $publicationPredicatesDataType = '';
  /**
   * @var string[]
   */
  public $verifiedDomains;

  /**
   * @param string
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
   * @param string
   */
  public function setOnboardingState($onboardingState)
  {
    $this->onboardingState = $onboardingState;
  }
  /**
   * @return string
   */
  public function getOnboardingState()
  {
    return $this->onboardingState;
  }
  /**
   * @param PaymentOptions
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
   * @param Product[]
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
   * @param string
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
   * @param PublicationPredicates
   */
  public function setPublicationPredicates(PublicationPredicates $publicationPredicates)
  {
    $this->publicationPredicates = $publicationPredicates;
  }
  /**
   * @return PublicationPredicates
   */
  public function getPublicationPredicates()
  {
    return $this->publicationPredicates;
  }
  /**
   * @param string[]
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
