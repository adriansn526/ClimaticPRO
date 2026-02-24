#!/bin/bash
WP_CMD="docker exec -u www-data climaticpro-wordpress-1 php wp-cli.phar"

# Function to merge categories using destination SLUG
merge_cats_to_slug() {
  OLD_ID=$1
  TARGET_SLUG=$2
  OLD_SLUG=$3
  
  echo "---------------------------------------------------"
  echo "Merging Category ID $OLD_ID ($OLD_SLUG) -> Target Slug '$TARGET_SLUG'"
  
  # Get product IDs assigned to old category
  pids=$($WP_CMD post list --post_type=product --product_cat=$OLD_SLUG --field=ID --format=ids | tr '\n' ' ')
  
  if [ ! -z "$pids" ] && [ "$pids" != " " ]; then
      echo "Moving products..."
      for pid in $pids; do
          # Using the slug ensures we target the existing term
          $WP_CMD post term add $pid product_cat $TARGET_SLUG
      done
      
      echo "Successfully assigned new category."
      $WP_CMD term delete product_cat $OLD_ID
  else
      echo "No products found in category $OLD_SLUG. Deleting empty category..."
      $WP_CMD term delete product_cat $OLD_ID
  fi
}

echo "Starting Fix V2..."

# 514 (ID 560) -> Aer conditionat comercial (aparat-de-aer-conditionat-comercial)
merge_cats_to_slug 560 "aparat-de-aer-conditionat-comercial" "514"

# 515 (ID 559) -> Aer Condiționat Rezidențial (aer-conditionat-rezidential)
merge_cats_to_slug 559 "aer-conditionat-rezidential" "515"

echo "---------------------------------------------------"
echo "Fix V2 complete."
