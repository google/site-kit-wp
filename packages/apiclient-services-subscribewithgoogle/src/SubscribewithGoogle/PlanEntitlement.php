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

class PlanEntitlement extends \Google\Collection
{
  protected $collection_key = 'productIds';
  /**
   * Timestamp when these entitlements are considered expired.
   *
   * @var string
   */
  public $expireTime;
  /**
   * A set of the publication's product IDs the user has access to.This is the
   * same product ID as can be found in Schema.org markup
   * (http://schema.org/productID). The format is 'pulication_id:label'.
   *
   * @var string[]
   */
  public $productIds;
  /**
   * The id of the entitlement source. eg 'google', 'youtube', publication id
   * itself etc.
   *
   * @var string
   */
  public $source;
  /**
   * A source-specific subscription token. It's an opaque string that represents
   * the subscription at the source and it stays unchanged for the duration of
   * the subscription. This token is unique per a publication and a source
   * combination.
   *
   * @var string
   */
  public $subscriptionToken;

  /**
   * Timestamp when these entitlements are considered expired.
   *
   * @param string $expireTime
   */
  public function setExpireTime($expireTime)
  {
    $this->expireTime = $expireTime;
  }
  /**
   * @return string
   */
  public function getExpireTime()
  {
    return $this->expireTime;
  }
  /**
   * A set of the publication's product IDs the user has access to.This is the
   * same product ID as can be found in Schema.org markup
   * (http://schema.org/productID). The format is 'pulication_id:label'.
   *
   * @param string[] $productIds
   */
  public function setProductIds($productIds)
  {
    $this->productIds = $productIds;
  }
  /**
   * @return string[]
   */
  public function getProductIds()
  {
    return $this->productIds;
  }
  /**
   * The id of the entitlement source. eg 'google', 'youtube', publication id
   * itself etc.
   *
   * @param string $source
   */
  public function setSource($source)
  {
    $this->source = $source;
  }
  /**
   * @return string
   */
  public function getSource()
  {
    return $this->source;
  }
  /**
   * A source-specific subscription token. It's an opaque string that represents
   * the subscription at the source and it stays unchanged for the duration of
   * the subscription. This token is unique per a publication and a source
   * combination.
   *
   * @param string $subscriptionToken
   */
  public function setSubscriptionToken($subscriptionToken)
  {
    $this->subscriptionToken = $subscriptionToken;
  }
  /**
   * @return string
   */
  public function getSubscriptionToken()
  {
    return $this->subscriptionToken;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PlanEntitlement::class, 'Google_Service_SubscribewithGoogle_PlanEntitlement');
