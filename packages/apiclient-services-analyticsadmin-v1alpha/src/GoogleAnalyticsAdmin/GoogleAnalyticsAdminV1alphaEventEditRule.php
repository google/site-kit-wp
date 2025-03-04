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

namespace Google\Service\GoogleAnalyticsAdmin;

class GoogleAnalyticsAdminV1alphaEventEditRule extends \Google\Collection
{
  protected $collection_key = 'parameterMutations';
  /**
   * @var string
   */
  public $displayName;
  protected $eventConditionsType = GoogleAnalyticsAdminV1alphaMatchingCondition::class;
  protected $eventConditionsDataType = 'array';
  /**
   * @var string
   */
  public $name;
  protected $parameterMutationsType = GoogleAnalyticsAdminV1alphaParameterMutation::class;
  protected $parameterMutationsDataType = 'array';
  /**
   * @var string
   */
  public $processingOrder;

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
   * @param GoogleAnalyticsAdminV1alphaMatchingCondition[]
   */
  public function setEventConditions($eventConditions)
  {
    $this->eventConditions = $eventConditions;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaMatchingCondition[]
   */
  public function getEventConditions()
  {
    return $this->eventConditions;
  }
  /**
   * @param string
   */
  public function setName($name)
  {
    $this->name = $name;
  }
  /**
   * @return string
   */
  public function getName()
  {
    return $this->name;
  }
  /**
   * @param GoogleAnalyticsAdminV1alphaParameterMutation[]
   */
  public function setParameterMutations($parameterMutations)
  {
    $this->parameterMutations = $parameterMutations;
  }
  /**
   * @return GoogleAnalyticsAdminV1alphaParameterMutation[]
   */
  public function getParameterMutations()
  {
    return $this->parameterMutations;
  }
  /**
   * @param string
   */
  public function setProcessingOrder($processingOrder)
  {
    $this->processingOrder = $processingOrder;
  }
  /**
   * @return string
   */
  public function getProcessingOrder()
  {
    return $this->processingOrder;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(GoogleAnalyticsAdminV1alphaEventEditRule::class, 'Google_Service_GoogleAnalyticsAdmin_GoogleAnalyticsAdminV1alphaEventEditRule');
