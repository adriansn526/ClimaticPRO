#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Listing categories..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { productCategories(first: 50) { nodes { name slug count } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
