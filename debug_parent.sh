#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Fetching products for parent category 'aer-conditionat-rezidential'..."
# We expect products from 'split-de-perete' to appear if children logic handles it.
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 5, where: { category: \"aer-conditionat-rezidential\" }) { nodes { name productCategories { nodes { name slug } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
