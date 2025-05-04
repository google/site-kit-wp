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
   * @var string
   */
  public $expireTime;
  /**
   * @var string[]
   */
  public $productIds;
  /**
   * @var string
   */
  public $source;
  /**
   * @var string
   */
  public $subscriptionToken;

  /**
   * @param string
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
   * @param string[]
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
   * @param string
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
   * @param string
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
